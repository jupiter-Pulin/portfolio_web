// Counters, limits and config for /api/ask, tested directly (the handler-level
// behaviour is in tests/askApi.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIDE } from '../src/content/guide.ts';
import { DEV_IP_SALT, askEnabled, maxQuestionChars, readConfig } from '../src/server/ask/config.ts';
import {
  COUNTER_TTL_SEC,
  bump,
  checkBudget,
  checkVisitor,
  clientIp,
  dayKey,
  monthKey,
  recordCost,
  visitorKey,
} from '../src/server/ask/limits.ts';
import { createMemoryStore, createUpstashStore, selectStore } from '../src/server/ask/store.ts';
import { UPSTASH_URL, baseEnv, captureLog, fakeUpstash } from './fixtures/askHarness.mjs';

const NOW = new Date('2026-09-14T12:00:00Z');

test('keys carry the UTC day or month, and a visitor key never carries the IP', () => {
  assert.equal(dayKey(NOW, 'requests'), 'ask:day:2026-09-14:requests');
  assert.equal(dayKey(new Date('2026-09-14T23:59:59Z'), 'cost'), 'ask:day:2026-09-14:cost');
  assert.equal(monthKey(NOW), 'ask:month:2026-09:cost');
  const key = visitorKey('203.0.113.7', 'salt', NOW);
  assert.match(key, /^ask:visitor:2026-09-14:[0-9a-f]{32}$/);
  assert.ok(!key.includes('203.0.113.7'));
  assert.notEqual(visitorKey('203.0.113.7', 'other', NOW), key, 'the salt matters');
  assert.equal(visitorKey('203.0.113.7', 'salt', NOW), key, 'stable within a day');
});

test('clientIp: first forwarded hop, then x-real-ip, then unknown', () => {
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })), '203.0.113.7');
  assert.equal(clientIp(new Headers({ 'x-real-ip': '203.0.113.9' })), '203.0.113.9');
  assert.equal(clientIp(new Headers()), 'unknown');
});

test('visitor limit and budget thresholds on the memory store', async () => {
  const store = createMemoryStore();
  const cfg = { ipSalt: 's', visitorDailyLimit: 2, dailyBudgetUsd: 0.5, monthlyBudgetUsd: 1 };
  assert.equal(await checkVisitor(store, 'a', NOW, cfg), true);
  assert.equal(await checkVisitor(store, 'a', NOW, cfg), true);
  assert.equal(await checkVisitor(store, 'a', NOW, cfg), false, 'third visit over a limit of 2');
  assert.equal(await checkVisitor(store, 'b', NOW, cfg), true, 'another IP has its own count');

  assert.equal(await checkBudget(store, NOW, cfg), true);
  await recordCost(store, NOW, 0.49);
  assert.equal(await checkBudget(store, NOW, cfg), true);
  await recordCost(store, NOW, 0.01);
  assert.equal(await checkBudget(store, NOW, cfg), false, 'reaching the daily threshold stops calls');
  assert.equal(await checkBudget(store, new Date('2026-09-15T00:00:00Z'), cfg), true, 'a new day');
  await recordCost(store, new Date('2026-09-15T00:00:00Z'), 0.5);
  assert.equal(await checkBudget(store, new Date('2026-09-16T00:00:00Z'), cfg), false, 'the month total is 1.0');

  await bump(store, 'requests', NOW);
  await bump(store, 'requests', NOW);
  assert.equal(await store.get('ask:day:2026-09-14:requests'), '2');
});

test('the Upstash store speaks REST pipelines with a bearer token and sets TTLs', async () => {
  const upstash = fakeUpstash();
  const store = createUpstashStore({ url: `${UPSTASH_URL}/`, token: 'tok', fetch: upstash.handle });
  assert.equal(await store.incr('k', COUNTER_TTL_SEC), 1);
  assert.equal(await store.incr('k', COUNTER_TTL_SEC), 2);
  assert.equal(await store.incrByFloat('f', 0.25, 60), 0.25);
  assert.equal(await store.get('k'), '2');
  assert.equal(await store.get('missing'), null);
  assert.equal(upstash.ttl.get('k'), COUNTER_TTL_SEC);
  assert.equal(upstash.ttl.get('f'), 60);
  for (const r of upstash.requests) {
    assert.equal(r.url, `${UPSTASH_URL}/pipeline`);
    assert.equal(r.headers.Authorization, 'Bearer tok');
  }
  assert.deepEqual(JSON.parse(upstash.requests[0].body), [
    ['INCR', 'k'],
    ['EXPIRE', 'k', COUNTER_TTL_SEC],
  ]);

  for (const fail of ['reject', 500]) {
    const broken = createUpstashStore({ url: UPSTASH_URL, token: 'secret-token', fetch: fakeUpstash({ fail }).handle });
    await assert.rejects(broken.incr('k', 1), (err) => {
      assert.ok(!err.message.includes('secret-token') && !err.message.includes(UPSTASH_URL));
      return true;
    });
  }
});

test('selectStore: Upstash when configured, an error in production, memory elsewhere', () => {
  const log = captureLog();
  const upstash = selectStore({ UPSTASH_REDIS_REST_URL: UPSTASH_URL, UPSTASH_REDIS_REST_TOKEN: 't' }, fetch, log);
  assert.equal(upstash.kind, 'upstash');
  assert.deepEqual(selectStore({ NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: UPSTASH_URL }, fetch, log), {
    error: 'config',
    names: ['UPSTASH_REDIS_REST_TOKEN'],
  });
  assert.equal(log.entries.length, 0);
  const memory = selectStore({ NODE_ENV: 'development' }, fetch, log);
  assert.equal(memory.kind, 'memory');
  assert.equal(log.entries.length, 1);
  assert.equal(log.entries[0].level, 'info');
  assert.match(log.entries[0].text, /memory/);
});

test('readConfig: defaults, required names, and nothing but names in an error', () => {
  const cfg = readConfig(baseEnv());
  assert.equal(cfg.dev, true);
  assert.equal(cfg.provider, 'openai-compatible');
  assert.equal(cfg.dailyBudgetUsd, 2);
  assert.equal(cfg.monthlyBudgetUsd, 20);
  assert.equal(cfg.visitorDailyLimit, 10);
  assert.equal(cfg.maxQuestionChars, GUIDE.limits.maxQuestionChars);
  assert.equal(cfg.serverDeadlineMs, 5000);
  assert.equal(cfg.ipSalt, DEV_IP_SALT);
  assert.equal(cfg.upstash, null);
  assert.equal(maxQuestionChars({}), 100);
  assert.equal(maxQuestionChars({ ASK_MAX_QUESTION_CHARS: '40' }), 40);

  assert.deepEqual(readConfig({}).names.sort(), [
    'ASK_MODEL',
    'ASK_MODEL_API_KEY',
    'ASK_MODEL_BASE_URL',
    'ASK_PRICE_INPUT_USD_PER_MTOK',
    'ASK_PRICE_OUTPUT_USD_PER_MTOK',
  ]);
  const prod = readConfig(baseEnv({ NODE_ENV: 'production', ASK_MODEL_API_KEY: 'sk-value' }));
  assert.deepEqual(prod.names.sort(), ['ASK_IP_SALT', 'UPSTASH_REDIS_REST_TOKEN', 'UPSTASH_REDIS_REST_URL']);
  assert.ok(!JSON.stringify(prod).includes('sk-value'));
  assert.deepEqual(readConfig(baseEnv({ ASK_SERVER_DEADLINE_MS: '6000' })).names, ['ASK_SERVER_DEADLINE_MS']);
  assert.deepEqual(readConfig(baseEnv({ ASK_PROVIDER: 'bogus' })).names, ['ASK_PROVIDER']);
  assert.deepEqual(readConfig(baseEnv({ ASK_DAILY_BUDGET_USD: 'lots' })).names, ['ASK_DAILY_BUDGET_USD']);
  assert.equal(readConfig(baseEnv({ ASK_DAILY_BUDGET_USD: '0.5' })).dailyBudgetUsd, 0.5);

  assert.equal(askEnabled({}), true);
  assert.equal(askEnabled({ ASK_ENABLED: 'true' }), true);
  assert.equal(askEnabled({ ASK_ENABLED: 'false' }), false);
});
