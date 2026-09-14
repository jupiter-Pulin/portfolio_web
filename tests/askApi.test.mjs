// POST /api/ask through createAskHandler: the HTTP contract, limits, budget,
// switch, config, store failures, the deadline and what must never leak.
// Everything is injected — memory or fake-Upstash counters, fake providers and
// fake fetch — so no request leaves the process.
import test from 'node:test';
import assert from 'node:assert/strict';
import index from '../src/generated/ask-index.json' with { type: 'json' };
import { COUNTER_TTL_SEC, dayKey, monthKey, visitorKey } from '../src/server/ask/limits.ts';
import { createAskHandler } from '../src/server/ask/handler.ts';
import { DEV_IP_SALT } from '../src/server/ask/config.ts';
import { createMemoryStore } from '../src/server/ask/store.ts';
import { ProviderError } from '../src/server/ask/providers/index.ts';
import {
  MODEL_BASE,
  UPSTASH_URL,
  baseEnv,
  captureLog,
  completion,
  fakeFetch,
  fakeProvider,
  fakeUpstash,
  fixedClock,
  post,
  readJson,
  upstashEnv,
} from './fixtures/askHarness.mjs';

const NOON = '2026-09-14T12:00:00Z';
const day = (metric, iso = NOON) => dayKey(new Date(iso), metric);
const num = async (store, key) => Number((await store.get(key)) ?? 0);

/** A handler over a memory store and a fake provider, with the parts exposed. */
function setup({ env = baseEnv(), provider = fakeProvider(), store = createMemoryStore(), clock = fixedClock(NOON), fetch } = {}) {
  const log = captureLog();
  const handler = createAskHandler({ env, index, store, provider, clock, log, fetch: fetch ?? fakeFetch() });
  return { handler, store, provider, clock, log };
}

const CHAIN_ANSWER = 'chain-pulse 每晚运行，并提交 reports/STATUS.md。';

test('a valid answer comes back with exactly ok, key, scopeId and answer', async () => {
  const provider = fakeProvider(() => ({
    content: JSON.stringify({ key: 'overview', scopeId: 'chain', answer: CHAIN_ANSWER }),
    usage: { inputTokens: 100, outputTokens: 50 },
  }));
  const { handler, store } = setup({ provider });
  const res = await readJson(await post(handler, { question: 'chain-pulse 是什么', scopeId: null }));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true, key: 'overview', scopeId: 'chain', answer: CHAIN_ANSWER });
  assert.equal(Object.keys(res.body).length, 4);
  assert.equal(await num(store, day('answered')), 1);
  // 100 × $1 + 50 × $2 per million tokens.
  assert.ok(Math.abs((await num(store, day('cost'))) - 0.0002) < 1e-12);

  const all = setup({ provider: fakeProvider(() => ({ content: '{"key":"all","scopeId":"loop","answer":"OK"}', usage: { inputTokens: 1, outputTokens: 1 } })) });
  const back = await readJson(await post(all.handler, { question: 'back to everything', scopeId: 'loop' }));
  assert.equal(back.status, 200);
  assert.equal(back.body.scopeId, null, '"all" always clears the scope');

  const chip = await post(handler, { question: "What's the stack?", scopeId: 'chain', intent: 'stack', langSample: '技术栈是什么' });
  assert.equal(chip.status, 200);
});

test('malformed requests are 400 and count nothing', async () => {
  const { handler, store, provider } = setup();
  assert.equal((await post(handler, { question: 'x'.repeat(100), scopeId: null })).status, 200);
  const before = { requests: await num(store, day('requests')), calls: provider.calls.length };
  const visitor = visitorKey('198.51.100.1', DEV_IP_SALT, new Date(NOON));
  const visits = await num(store, visitor);

  const bad = [
    { question: 'x'.repeat(101), scopeId: null },
    { question: '', scopeId: null },
    { question: '   ', scopeId: null },
    '{not json',
    { question: 42, scopeId: null },
    { question: 'hi' },
    { question: 'hi', scopeId: 'nope' },
    { question: 'hi', scopeId: null, intent: 'weather' },
    { question: 'hi', scopeId: null, langSample: 7 },
    { question: 'hi', scopeId: null, langSample: '   ' },
    { question: 'hi', scopeId: null, langSample: 'x'.repeat(101) },
  ];
  for (const body of bad) {
    const res = await readJson(await post(handler, body));
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.deepEqual(res.body, { ok: false, error: 'invalid' });
  }
  assert.equal(await num(store, day('requests')), before.requests);
  assert.equal(await num(store, visitor), visits);
  assert.equal(provider.calls.length, before.calls);
});

test('the visitor limit is per hashed IP per UTC day', async () => {
  const { handler, store, provider, clock } = setup();
  const ip = '203.0.113.7';
  await store.incrByFloat(visitorKey(ip, DEV_IP_SALT, new Date(NOON)), 10, 60);

  const limited = await readJson(await post(handler, { question: 'hi', scopeId: null }, { 'x-forwarded-for': `${ip}, 10.0.0.1` }));
  assert.equal(limited.status, 429);
  assert.deepEqual(limited.body, { ok: false, error: 'limited', reason: 'visitor' });
  assert.equal(provider.calls.length, 0);
  assert.equal(await num(store, day('limited:visitor')), 1);
  assert.equal(await num(store, day('requests')), 1);

  assert.equal((await post(handler, { question: 'hi', scopeId: null }, { 'x-forwarded-for': '203.0.113.8' })).status, 200);
  clock.now = Date.parse('2026-09-15T00:00:00Z');
  assert.equal((await post(handler, { question: 'hi', scopeId: null }, { 'x-forwarded-for': ip })).status, 200);

  // Only x-real-ip: that address is the one counted.
  const real = setup();
  await real.store.incrByFloat(visitorKey('203.0.113.9', DEV_IP_SALT, new Date(NOON)), 10, 60);
  const res = await real.handler(
    new Request('http://localhost/api/ask', { method: 'POST', headers: { 'x-real-ip': '203.0.113.9' }, body: '{"question":"hi","scopeId":null}' }),
  );
  assert.equal(res.status, 429);
});

test('budget is checked before the call; a call may overshoot, the next one is refused', async () => {
  for (const [key, value] of [
    [day('cost'), 2.0],
    [monthKey(new Date(NOON)), 20.0],
  ]) {
    const { handler, store, provider } = setup();
    await store.incrByFloat(key, value, 60);
    const res = await readJson(await post(handler, { question: 'hi', scopeId: null }));
    assert.equal(res.status, 429, key);
    assert.deepEqual(res.body, { ok: false, error: 'limited', reason: 'budget' });
    assert.equal(provider.calls.length, 0);
    assert.equal(await num(store, day('requests')), 1);
    assert.equal(await num(store, day('limited:budget')), 1);
  }

  // $0.05: 50,000 input tokens at $1 per million.
  const provider = fakeProvider(() => ({ content: '{"key":"overview","scopeId":"chain","answer":"OK"}', usage: { inputTokens: 50000, outputTokens: 0 } }));
  const { handler, store } = setup({ provider });
  await store.incrByFloat(day('cost'), 1.99, 60);
  assert.equal((await post(handler, { question: 'hi', scopeId: null })).status, 200);
  assert.ok(Math.abs((await num(store, day('cost'))) - 2.04) < 1e-9);
  assert.ok(Math.abs((await num(store, monthKey(new Date(NOON)))) - 0.05) < 1e-9);
  const next = await readJson(await post(handler, { question: 'hi', scopeId: null }));
  assert.equal(next.status, 429);
  assert.equal(next.body.reason, 'budget');

  const low = setup({ env: baseEnv({ ASK_DAILY_BUDGET_USD: '0.5' }) });
  await low.store.incrByFloat(day('cost'), 0.5, 60);
  assert.equal((await readJson(await post(low.handler, { question: 'hi', scopeId: null }))).body.reason, 'budget');
  const under = setup({ env: baseEnv({ ASK_DAILY_BUDGET_USD: '0.5' }) });
  await under.store.incrByFloat(day('cost'), 0.49, 60);
  assert.equal((await post(under.handler, { question: 'hi', scopeId: null })).status, 200);
});

test('ASK_ENABLED=false: unavailable, no model, no visitor count', async () => {
  const { handler, store, provider } = setup({ env: baseEnv({ ASK_ENABLED: 'false' }) });
  const res = await readJson(await post(handler, { question: 'hi', scopeId: null }));
  assert.equal(res.status, 503);
  assert.deepEqual(res.body, { ok: false, error: 'unavailable' });
  assert.equal(provider.calls.length, 0);
  assert.equal(await store.get(visitorKey('198.51.100.1', DEV_IP_SALT, new Date(NOON))), null);
  assert.equal(await num(store, day('unavailable')), 1);
});

test('provider failures and malformed output are 502 system; content is never filtered', async () => {
  const usage = { inputTokens: 1000, outputTokens: 0 };
  const cases = [
    ['throws', 'error:provider', { provider: fakeProvider(() => { throw new ProviderError('boom'); }) }],
    ['402', 'error:provider', { provider: null, model: () => Response.json({ error: { message: 'Insufficient Balance' } }, { status: 402 }) }],
    ['not json', 'error:invalid', { content: 'Sure! chain-pulse is…' }],
    ['bad key', 'error:invalid', { content: '{"key":"weather","scopeId":null,"answer":"OK"}' }],
    ['bad scope', 'error:invalid', { content: '{"key":"stack","scopeId":"ghost","answer":"OK"}' }],
    ['empty answer', 'error:invalid', { content: '{"key":"stack","scopeId":null,"answer":""}' }],
    ['blank answer', 'error:invalid', { content: '{"key":"stack","scopeId":null,"answer":"   "}' }],
    ['long answer', 'error:invalid', { content: JSON.stringify({ key: 'stack', scopeId: null, answer: 'x'.repeat(2001) }) }],
  ];
  for (const [name, metric, spec] of cases) {
    let setupArgs;
    if ('content' in spec) setupArgs = { provider: fakeProvider(() => ({ content: spec.content, usage })) };
    else if (spec.model) setupArgs = { provider: null, fetch: fakeFetch({ model: spec.model }) };
    else setupArgs = { provider: spec.provider };
    const { handler, store } = setup(setupArgs);
    const res = await readJson(await post(handler, { question: 'hi', scopeId: null }));
    assert.equal(res.status, 502, name);
    assert.deepEqual(res.body, { ok: false, error: 'system' }, name);
    assert.equal(await num(store, day(metric)), 1, `${name} counts ${metric}`);
    if ('content' in spec) assert.ok(Math.abs((await num(store, day('cost'))) - 0.001) < 1e-12, `${name}: usage is still billed`);
  }

  const passthrough = 'It has 999 tests, see https://example.com';
  const { handler } = setup({
    provider: fakeProvider(() => ({ content: JSON.stringify({ key: 'stack', scopeId: 'amm', answer: passthrough }), usage })),
  });
  const res = await readJson(await post(handler, { question: 'hi', scopeId: null }));
  assert.equal(res.status, 200);
  assert.equal(res.body.answer, passthrough);
  const zh = setup({
    provider: fakeProvider(() => ({ content: JSON.stringify({ key: 'stack', scopeId: 'amm', answer: '它有 999 个测试，见 https://example.com' }), usage })),
  });
  assert.equal((await readJson(await post(zh.handler, { question: 'hi', scopeId: null }))).body.answer, '它有 999 个测试，见 https://example.com');
});

test('the server deadline aborts the model call and answers 504', async () => {
  let seen;
  const provider = fakeProvider((req) => {
    seen = req.signal;
    return new Promise((resolve) => setTimeout(() => resolve({ content: '{"key":"all","scopeId":null,"answer":"late"}', usage: { inputTokens: 1, outputTokens: 1 } }), 1000));
  });
  const { handler, store } = setup({ env: baseEnv({ ASK_SERVER_DEADLINE_MS: '50' }), provider });
  const started = Date.now();
  const res = await readJson(await post(handler, { question: 'hi', scopeId: null }));
  const took = Date.now() - started;
  assert.equal(res.status, 504);
  assert.deepEqual(res.body, { ok: false, error: 'system' });
  assert.ok(took < 150, `answered in ${took}ms`);
  assert.equal(seen.aborted, true);
  assert.equal(await num(store, day('error:timeout')), 1);
});

test('configuration errors: 503, no model call, one warning that names but never quotes', async () => {
  const full = baseEnv({ ASK_MODEL_API_KEY: 'sk-sentinel-value', ASK_MODEL_BASE_URL: MODEL_BASE });
  const drop = (name) => {
    const env = { ...full };
    delete env[name];
    return env;
  };
  const cases = [
    [drop('ASK_MODEL_API_KEY'), 'ASK_MODEL_API_KEY'],
    [drop('ASK_PRICE_INPUT_USD_PER_MTOK'), 'ASK_PRICE_INPUT_USD_PER_MTOK'],
    [drop('ASK_PRICE_OUTPUT_USD_PER_MTOK'), 'ASK_PRICE_OUTPUT_USD_PER_MTOK'],
    [drop('ASK_MODEL'), 'ASK_MODEL'],
    [drop('ASK_MODEL_BASE_URL'), 'ASK_MODEL_BASE_URL'],
    [{ ...full, ASK_PROVIDER: 'bogus' }, 'ASK_PROVIDER'],
    [{ ...full, ASK_SERVER_DEADLINE_MS: '6000' }, 'ASK_SERVER_DEADLINE_MS'],
    [{ ...full, NODE_ENV: 'production', ASK_IP_SALT: 'salt-sentinel-value' }, 'UPSTASH_REDIS_REST_URL'],
    [{ ...full, NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: UPSTASH_URL, UPSTASH_REDIS_REST_TOKEN: 'tok-sentinel-value' }, 'ASK_IP_SALT'],
  ];
  for (const [env, name] of cases) {
    const fetch = fakeFetch({ upstash: fakeUpstash() });
    const { handler, store, log } = setup({ env, provider: null, fetch });
    const res = await readJson(await post(handler, { question: 'hi', scopeId: null }));
    assert.equal(res.status, 503, name);
    assert.deepEqual(res.body, { ok: false, error: 'system' });
    assert.equal(fetch.modelCalls.length, 0, `${name}: no model call`);
    assert.equal(await num(store, day('error:config')), 1, name);
    const warns = log.entries.filter((e) => e.level === 'warn');
    assert.equal(warns.length, 1, name);
    assert.ok(warns[0].text.includes(name), `${name} is named`);
    for (const value of Object.values(env)) {
      if (value.length < 8) continue; // short values like "1" or "test" are not secrets
      assert.ok(!log.entries.some((e) => e.text.includes(value)), `${name}: the log never quotes ${value}`);
    }
  }

  // Production with no store injected and no Upstash: nothing leaves the process at all.
  const fetch = fakeFetch();
  const log = captureLog();
  const handler = createAskHandler({ env: { ...full, NODE_ENV: 'production' }, index, clock: fixedClock(NOON), log, fetch });
  assert.equal((await post(handler, { question: 'hi', scopeId: null })).status, 503);
  assert.equal(fetch.modelCalls.length, 0);
  assert.equal(log.entries.filter((e) => e.level === 'warn').length, 1);
});

test('a failing Upstash is 503 system, with neither its URL nor token in body or log', async () => {
  for (const fail of ['reject', 500]) {
    const upstash = fakeUpstash({ fail });
    const env = upstashEnv({ UPSTASH_REDIS_REST_TOKEN: 'upstash-token-sentinel' });
    const fetch = fakeFetch({ upstash });
    const log = captureLog();
    const provider = fakeProvider();
    const handler = createAskHandler({ env, index, provider, clock: fixedClock(NOON), log, fetch });
    const res = await post(handler, { question: 'hi', scopeId: null });
    const text = await res.text();
    assert.equal(res.status, 503, String(fail));
    assert.deepEqual(JSON.parse(text), { ok: false, error: 'system' });
    assert.equal(provider.calls.length, 0);
    assert.equal(log.entries.length, 1, `${fail}: one log line`);
    for (const secret of [UPSTASH_URL, 'upstash-token-sentinel']) {
      assert.ok(!text.includes(secret));
      assert.ok(!log.entries.some((e) => e.text.includes(secret)));
    }
  }
});

test('Upstash receives day counters, a hashed visitor key, a bearer token and float costs', async () => {
  const upstash = fakeUpstash();
  const fetch = fakeFetch({ upstash });
  const handler = createAskHandler({
    env: upstashEnv({ ASK_IP_SALT: 'pepper' }),
    index,
    clock: fixedClock(NOON),
    log: captureLog(),
    fetch,
  });
  const res = await post(handler, { question: 'chain-pulse 是什么', scopeId: null }, { 'x-forwarded-for': '203.0.113.7' });
  assert.equal(res.status, 200);

  const commands = upstash.requests.flatMap((r) => JSON.parse(r.body));
  assert.ok(commands.some((c) => c[0] === 'INCR' && c[1] === 'ask:day:2026-09-14:requests'));
  assert.ok(commands.some((c) => c[0] === 'EXPIRE' && c[1] === 'ask:day:2026-09-14:requests' && c[2] === 2592000));
  const visitor = commands.find((c) => c[0] === 'INCR' && c[1].startsWith('ask:visitor:'));
  assert.match(visitor[1], /^ask:visitor:2026-09-14:[0-9a-f]{32}$/);
  assert.ok(commands.some((c) => c[0] === 'INCRBYFLOAT' && c[1] === 'ask:day:2026-09-14:cost'));
  assert.ok(commands.some((c) => c[0] === 'INCRBYFLOAT' && c[1] === 'ask:month:2026-09:cost'));
  for (const r of upstash.requests) {
    assert.equal(r.headers.Authorization, 'Bearer test-upstash-token');
    assert.ok(!r.url.includes('203.0.113.7') && !r.body.includes('203.0.113.7'));
  }
});

test('outside production with no Upstash: memory counters, real provider, one info line', async () => {
  const env = baseEnv({ NODE_ENV: 'development', ASK_VISITOR_DAILY_LIMIT: '3' });
  const fetch = fakeFetch();
  const log = captureLog();
  const handler = createAskHandler({ env, index, clock: fixedClock(NOON), log, fetch });
  for (let i = 0; i < 3; i++) assert.equal((await post(handler, { question: 'hi', scopeId: null })).status, 200);
  assert.equal(fetch.modelCalls.length, 3, 'the paid model is really called');
  // The limit is 3: a fourth request proves the in-process count reached 3 and persisted.
  assert.equal((await post(handler, { question: 'hi', scopeId: null })).status, 429);
  assert.equal(fetch.modelCalls.length, 3);
  assert.equal(log.entries.length, 1);
  assert.equal(log.entries[0].level, 'info');
  assert.match(log.entries[0].text, /memory/);

  const prod = createAskHandler({ env: { ...env, NODE_ENV: 'production' }, index, clock: fixedClock(NOON), log: captureLog(), fetch });
  assert.equal((await post(prod, { question: 'hi', scopeId: null })).status, 503);
  assert.equal(fetch.modelCalls.length, 3);
});

test('a day of mixed outcomes lands in Upstash as counts, never as text or IPs', async () => {
  const upstash = fakeUpstash();
  const clock = fixedClock(NOON);
  const env = upstashEnv({ ASK_IP_SALT: 'pepper' });
  const make = (extraEnv, provider) =>
    createAskHandler({ env: { ...env, ...extraEnv }, index, clock, log: captureLog(), provider, fetch: fakeFetch({ upstash }) });
  const ok = fakeProvider(() => ({ content: '{"key":"stack","scopeId":"chain","answer":"Node only."}', usage: { inputTokens: 10000, outputTokens: 0 } }));

  const questions = ['What is the stack?', 'limit me', 'budget me', 'break me', 'switch me off'];
  const ips = ['203.0.113.21', '203.0.113.22', '203.0.113.23', '203.0.113.24', '203.0.113.25'];
  const sample = '这个项目用了什么技术';

  assert.equal((await post(make({}, ok), { question: questions[0], scopeId: 'chain', intent: 'stack', langSample: sample }, { 'x-forwarded-for': ips[0] })).status, 200);
  upstash.data.set(visitorKey(ips[1], 'pepper', new Date(NOON)), '10');
  assert.equal((await post(make({}, ok), { question: questions[1], scopeId: null }, { 'x-forwarded-for': ips[1] })).status, 429);
  assert.equal((await readJson(await post(make({ ASK_DAILY_BUDGET_USD: '0.01' }, ok), { question: questions[2], scopeId: null }, { 'x-forwarded-for': ips[2] }))).body.reason, 'budget');
  assert.equal((await post(make({}, fakeProvider(() => { throw new Error('down'); })), { question: questions[3], scopeId: null }, { 'x-forwarded-for': ips[3] })).status, 502);
  assert.equal((await post(make({ ASK_ENABLED: 'false' }, ok), { question: questions[4], scopeId: null }, { 'x-forwarded-for': ips[4] })).status, 503);

  const counts = {
    requests: '5',
    answered: '1',
    'limited:visitor': '1',
    'limited:budget': '1',
    'error:provider': '1',
    unavailable: '1',
    cost: '0.01',
  };
  for (const [metric, value] of Object.entries(counts)) {
    assert.equal(upstash.data.get(day(metric)), value, metric);
    assert.equal(upstash.ttl.get(day(metric)), COUNTER_TTL_SEC, `${metric} TTL`);
  }
  const everything = [...upstash.data.entries()].flat().join('\n') + [...upstash.ttl.keys()].join('\n');
  for (const secret of [...questions, sample, ...ips]) assert.ok(!everything.includes(secret), secret);
  assert.ok(!everything.includes(sample.toLowerCase()));
});

test('sentinel secrets never reach a response body or a log line', async () => {
  const KEY = 'SENTINEL-API-KEY-8c1f';
  const TOKEN = 'SENTINEL-UPSTASH-TOKEN-4be2';
  const SALT = 'SENTINEL-IP-SALT-77aa';
  const seen = [];
  const run = async (extraEnv, { provider, upstash = fakeUpstash(), body = { question: 'hi', scopeId: null }, model } = {}) => {
    const log = captureLog();
    const handler = createAskHandler({
      env: upstashEnv({ ASK_MODEL_API_KEY: KEY, UPSTASH_REDIS_REST_TOKEN: TOKEN, ASK_IP_SALT: SALT, ...extraEnv }),
      index,
      clock: fixedClock(NOON),
      log,
      provider,
      fetch: fakeFetch({ upstash, model }),
    });
    const res = await post(handler, body);
    seen.push(await res.text(), ...log.entries.map((e) => e.text));
  };
  await run({});
  await run({}, { body: { question: 'x'.repeat(101), scopeId: null } });
  await run({}, { body: { question: 'hi', scopeId: 'chain', intent: 'code', langSample: '代码在哪' } });
  await run({ ASK_ENABLED: 'false' });
  await run({ ASK_MODEL: '' });
  await run({ NODE_ENV: 'production', ASK_IP_SALT: '' });
  await run({ ASK_SERVER_DEADLINE_MS: '6000' });
  await run({ ASK_VISITOR_DAILY_LIMIT: '0' });
  await run({ ASK_DAILY_BUDGET_USD: '0' });
  await run({}, { upstash: fakeUpstash({ fail: 'reject' }) });
  await run({}, { upstash: fakeUpstash({ fail: 500 }) });
  await run({}, { model: () => Response.json({ error: { message: 'Insufficient Balance' } }, { status: 402 }) });
  await run({}, { model: () => completion('not json') });
  await run({}, { model: () => completion('{"key":"all","scopeId":null,"answer":"x"}', null) });
  await run({ ASK_SERVER_DEADLINE_MS: '20' }, { provider: fakeProvider(() => new Promise(() => {})) });
  await run({}, { provider: fakeProvider(() => { throw new Error(`leak ${KEY}`); }) });
  assert.ok(seen.length >= 16);
  for (const text of seen) {
    for (const secret of [KEY, TOKEN, SALT]) assert.ok(!text.includes(secret), `${secret} leaked in ${text}`);
  }
});

test('the route module loads, is a Node route, and refuses without env in production', async () => {
  const saved = { ...process.env };
  const realFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = async () => {
    fetches++;
    throw new Error('no network in tests');
  };
  try {
    for (const name of Object.keys(process.env)) {
      if (name.startsWith('ASK_') || name.startsWith('UPSTASH_')) delete process.env[name];
    }
    process.env.NODE_ENV = 'production';
    const route = await import('../src/app/api/ask/route.ts');
    assert.equal(route.runtime, 'nodejs');
    assert.equal(route.maxDuration, 10);
    assert.equal(typeof route.POST, 'function');
    const res = await readJson(await route.POST(new Request('http://localhost/api/ask', { method: 'POST', body: '{"question":"hi","scopeId":null}' })));
    assert.equal(res.status, 503);
    assert.deepEqual(res.body, { ok: false, error: 'system' });
    assert.equal(fetches, 0, 'nothing leaves the process');
  } finally {
    globalThis.fetch = realFetch;
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name];
    Object.assign(process.env, saved);
  }
});

test('model output is unwrapped losslessly before the structure check; refusals log their reason', async () => {
  // Paid eval at 859c153: one reply failed the structure check with no trace of why.
  const usage = { inputTokens: 10, outputTokens: 10 };
  const answer = 'Loop Conductor の承認はブランチの先頭に紐づきます。\n```not a fence```';
  const replies = [
    ['fenced', '```json\n' + JSON.stringify({ key: 'decision', scopeId: 'loop', answer }) + '\n```', 'loop'],
    ['prose around', 'Here you go: ' + JSON.stringify({ key: 'decision', scopeId: 'loop', answer }) + ' Hope that helps.', 'loop'],
    ['scope as name', JSON.stringify({ key: 'decision', scopeId: 'Loop Conductor', answer }), 'loop'],
    ['scope as id in caps', JSON.stringify({ key: 'decision', scopeId: ' LOOP ', answer }), 'loop'],
    ['name in lower case', JSON.stringify({ key: 'stack', scopeId: 'amm dex', answer }), 'amm'],
  ];
  for (const [name, content, scopeId] of replies) {
    const { handler, store } = setup({ provider: fakeProvider(() => ({ content, usage })) });
    const res = await readJson(await post(handler, { question: 'hi', scopeId: null }));
    assert.equal(res.status, 200, name);
    assert.deepEqual(res.body, { ok: true, key: name === 'name in lower case' ? 'stack' : 'decision', scopeId, answer }, name);
    assert.equal(await num(store, day('answered')), 1, name);
  }

  const refusals = [
    ['prose only', 'Sure! chain-pulse is…', 'not-json'],
    ['broken braces', 'answer: {key: stack}', 'not-json'],
    ['bad key', '{"key":"weather","scopeId":null,"answer":"OK"}', 'bad-key'],
    ['unknown name', '{"key":"stack","scopeId":"BIBO","answer":"OK"}', 'bad-scope'],
    ['blank answer', '```json\n{"key":"stack","scopeId":null,"answer":" "}\n```', 'bad-answer'],
  ];
  for (const [name, content, reason] of refusals) {
    const { handler, store, log } = setup({ provider: fakeProvider(() => ({ content, usage })) });
    const res = await readJson(await post(handler, { question: 'hi', scopeId: null }));
    assert.equal(res.status, 502, name);
    assert.deepEqual(res.body, { ok: false, error: 'system' }, name);
    assert.equal(await num(store, day('error:invalid')), 1, name);
    assert.deepEqual(log.entries.map((e) => e.level), ['warn'], name);
    assert.equal(log.entries[0].text, `ask: model output failed the structure check (${reason})`, name);
  }

  const { handler, store, log } = setup({ provider: fakeProvider(() => ({ content: '{"key":"stack","scopeId":null,"answer":"OK"}', usage: null })) });
  assert.equal((await post(handler, { question: 'hi', scopeId: null })).status, 502);
  assert.equal(await num(store, day('error:invalid')), 1);
  assert.deepEqual(log.entries, [{ level: 'warn', text: 'ask: model response carried no usage' }]);
});
