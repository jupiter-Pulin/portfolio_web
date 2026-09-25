// The paid provider, the prompt, target-language passing, the evaluation script
// and the env / docs contract. Fake fetch and fake providers only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import index from '../src/generated/ask-index.json' with { type: 'json' };
import BLOG_POSTS from '../src/generated/ask-blog.json' with { type: 'json' };
import { EMAIL, GITHUB, LINKEDIN, X } from '../src/content/links.ts';
import { GUIDE } from '../src/content/guide.ts';
import { LOOKING, PROJECTS } from '../src/content/projects.ts';
import { ANSWER_KEYS } from '../src/lib/askContract.ts';
import { TOP_K, createAskHandler } from '../src/server/ask/handler.ts';
import { SYSTEM_PROMPT, buildUserPrompt, normalizeQuestion } from '../src/server/ask/prompt.ts';
import { costUsd, selectProvider } from '../src/server/ask/providers/index.ts';
import { readConfig } from '../src/server/ask/config.ts';
import { createMemoryStore } from '../src/server/ask/store.ts';
import { detectLang, evaluate, explain } from '../scripts/eval-ask.mjs';
import { readModelOutput } from '../src/server/ask/output.ts';
import { MODEL_BASE, baseEnv, captureLog, completion, fakeFetch, fakeProvider, fixedClock, post } from './fixtures/askHarness.mjs';
import { privateFixture } from './fixtures/askPrivate.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

/** The body of one "## <title>" section of the user message. */
const section = (user, title) => {
  const m = user.match(new RegExp(`(?:^|\\n)## ${title}\\n([\\s\\S]*?)(?=\\n\\n## |$)`));
  assert.ok(m, `no "${title}" section`);
  return m[1];
};

const recording = () =>
  fakeProvider(() => ({ content: '{"key":"stack","scopeId":"amm","answer":"OK"}', usage: { inputTokens: 1, outputTokens: 1 } }));

const handlerWith = (provider, fetch) =>
  createAskHandler({ env: baseEnv(), index, store: createMemoryStore(), provider, clock: fixedClock('2026-09-14T12:00:00Z'), log: captureLog(), fetch: fetch ?? fakeFetch() });

test('openai-compatible: one chat-completions POST with the system prompt, key and signal', async () => {
  const fetch = fakeFetch({ model: () => completion('{"key":"overview","scopeId":"amm","answer":"OK"}', { prompt_tokens: 1200, completion_tokens: 80 }) });
  const res = await post(handlerWith(null, fetch), { question: 'AMM DEX?', scopeId: null });
  assert.equal(res.status, 200);
  assert.equal(fetch.modelCalls.length, 1);
  const [call] = fetch.modelCalls;
  assert.equal(call.url, `${MODEL_BASE}/chat/completions`);
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.headers.Authorization, 'Bearer test-api-key');
  assert.ok(call.init.signal instanceof AbortSignal, 'the deadline signal is passed through');
  assert.equal(call.body.model, 'test-model');
  assert.equal(call.body.temperature, 0);
  assert.equal(call.body.max_tokens, 700, 'the reply length is capped');
  assert.deepEqual(call.body.response_format, { type: 'json_object' });
  // Thinking on, a question that took thought spent all 700 tokens reasoning and returned no JSON.
  assert.deepEqual(call.body.thinking, { type: 'disabled' }, 'the model answers without thinking first');
  assert.equal(call.body.messages[0].role, 'system');
  assert.equal(call.body.messages[0].content, SYSTEM_PROMPT);
  assert.equal(call.body.messages[1].role, 'user');

  // The provider on its own: content and usage are read off the response.
  const config = readConfig(baseEnv());
  const provider = selectProvider(config, fetch);
  const out = await provider.ask({ system: 's', user: 'u', signal: new AbortController().signal });
  assert.deepEqual(out.usage, { inputTokens: 1200, outputTokens: 80 });
  assert.equal(out.content, '{"key":"overview","scopeId":"amm","answer":"OK"}');
  assert.equal(out.finishReason, undefined, 'no finish_reason in the response, none is made up');
  assert.equal(costUsd(out.usage, config), (1200 * 1 + 80 * 2) / 1e6);
  const cut = await selectProvider(config, fakeFetch({ model: () => completion('{"key": "looking", "', { prompt_tokens: 2591, completion_tokens: 700 }, 'length') })).ask({ system: 's', user: 'u', signal: new AbortController().signal });
  assert.equal(cut.finishReason, 'length', 'why the model stopped is read off the response');
  assert.equal(selectProvider({ ...config, provider: 'bogus' }, fetch), null);

  // No usage in the response: a structure failure, not an answer.
  const store = createMemoryStore();
  const noUsage = createAskHandler({
    env: baseEnv(),
    index,
    store,
    clock: fixedClock('2026-09-14T12:00:00Z'),
    log: captureLog(),
    fetch: fakeFetch({ model: () => completion('{"key":"overview","scopeId":"amm","answer":"OK"}', null) }),
  });
  const bad = await post(noUsage, { question: 'hi', scopeId: null });
  assert.equal(bad.status, 502);
  assert.deepEqual(await bad.json(), { ok: false, error: 'system' });
  assert.equal(await store.get('ask:day:2026-09-14:error:invalid'), '1');
});

test('the system prompt states the language, facts and output rules — and claims no checking', () => {
  const p = SYSTEM_PROMPT;
  assert.match(p, /target language/i);
  assert.match(p, /Target language sample/);
  assert.match(p, /not the question you answer/);
  // Thinking off, "他的 email 和 LinkedIn 是什么？" came back as "Email: …\nLinkedIn: …" with no Chinese at all.
  assert.match(p, /even when the answer is mostly addresses or links: introduce them in a sentence in the target language/);
  assert.match(p, /only from the site material/);
  assert.match(p, /does not cover the question, say plainly that the site does not say/);
  assert.match(p, /Never invent/);
  assert.match(p, /copy it exactly as written/);
  assert.match(p, /number, link or email address/);
  assert.match(p, /one JSON object and nothing else/);
  assert.match(p, /"key"/);
  assert.match(p, /"scopeId"/);
  assert.match(p, /"answer" is plain text/);
  assert.match(p, /private project is described only by its own material on this site/);
  assert.match(p, /never offer a repository for it/);
  assert.doesNotMatch(p, /https?:\/\//);
  assert.doesNotMatch(p, /verified|checked/i);
  for (const value of Object.values(baseEnv())) if (value.length > 4) assert.ok(!p.includes(value));
});

test('buildUserPrompt carries the catalogue, keys, scope, intent, candidates, links and question', () => {
  const candidates = [
    { id: 'loop:qa.stack:0', text: 'Loop Conductor: Node ≥ 22 with zero runtime dependencies.' },
    { id: 'site:looking:0', text: 'Backend or full-stack work.' },
  ];
  const input = { question: 'Where is the code?', scopeId: 'loop', intent: 'code', langSample: undefined, candidates };
  const user = buildUserPrompt(input);
  assert.equal(buildUserPrompt(input), user, 'deterministic');
  for (const p of PROJECTS) {
    for (const v of [p.id, p.name, p.short]) assert.ok(user.includes(v), v);
    for (const r of p.repos) assert.ok(user.includes(r.url), r.url);
  }
  const keys = section(user, 'Answer keys');
  for (const k of ANSWER_KEYS) assert.match(keys, new RegExp(`- ${k}: \\S`), `${k} has a meaning`);
  assert.equal(ANSWER_KEYS.length, 11);
  assert.equal(section(user, 'Current scope'), 'loop');
  assert.equal(section(user, 'Intent'), 'code');
  for (const c of candidates) assert.ok(section(user, 'Candidate passages').includes(c.text));
  for (const link of [EMAIL, LINKEDIN, GITHUB, X]) assert.ok(section(user, 'Public links').includes(link), link);
  assert.equal(section(user, 'Question'), 'Where is the code?');
  assert.equal(section(user, 'Target language sample'), 'Where is the code?');

  const secret = privateFixture();
  const priv = buildUserPrompt({ ...input, scopeId: 'secret', projects: [secret] });
  assert.ok(priv.includes(secret.scope));
  assert.ok(!priv.includes(secret.repos[0].url));
  assert.ok(!priv.includes(secret.readmeUrl));
  assert.doesNotMatch(section(priv, 'Project catalogue'), /https?:\/\//);
});

test('routing: site-wide keys take a null scope, and the looking / site-wide material is always sent', () => {
  // Paid eval at 35976b6: "AI agent work" came back agents/loop, and "what role is he looking for"
  // in zh/ja drifted to fallback because retrieval missed LOOKING.
  const p = SYSTEM_PROMPT;
  assert.match(p, /Site-wide keys — "payments", "agents", "looking", "contact" and "all"/);
  assert.match(p, /"agents" with scopeId null/);
  assert.match(p, /that is "looking", never "fallback"/);
  const user = buildUserPrompt({ question: '他在找什么样的工作？', scopeId: 'loop', candidates: [] });
  assert.equal(section(user, 'What Nolan is looking for'), LOOKING);
  const summaries = section(user, 'Site-wide summaries');
  for (const item of [...GUIDE.fit.items, ...GUIDE.agents.items, ...GUIDE.lp.items]) assert.ok(summaries.includes(item.text), item.text);
  assert.doesNotMatch(summaries, /https?:\/\//);
  const keys = section(user, 'Answer keys');
  for (const k of ['payments', 'agents', 'looking', 'contact', 'all']) assert.match(keys, new RegExp(`- ${k}: site-wide \\(scopeId null\\)`), k);
  for (const k of ['code', 'decision', 'stack', 'status', 'overview']) assert.match(keys, new RegExp(`- ${k}: project key`), k);
});

test('the blog post list is sent every time, between the site-wide summaries and the answer keys', () => {
  const input = { question: '他在找什么样的工作？', scopeId: null, candidates: [] };
  const user = buildUserPrompt(input);
  assert.equal(buildUserPrompt(input), user, 'deterministic');
  const titles = [...user.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  const at = titles.indexOf('Blog posts');
  assert.ok(at >= 0, 'has a Blog posts section');
  assert.equal(titles[at - 1], 'Site-wide summaries');
  assert.equal(titles[at + 1], 'Answer keys');

  assert.equal(BLOG_POSTS.length, 6);
  const lines = section(user, 'Blog posts').split('\n');
  assert.equal(lines.length, BLOG_POSTS.length, 'one line per post');
  BLOG_POSTS.forEach((post, i) => {
    assert.ok(lines[i].includes(post.title), post.title);
    for (const tag of post.tags) assert.ok(lines[i].includes(tag), `${post.slug}: ${tag}`);
    assert.ok(lines[i].includes(`/blog/${post.slug}`), post.slug);
  });

  assert.equal(section(buildUserPrompt({ ...input, posts: [] }), 'Blog posts'), 'none');
  const fixture = [{ slug: 'x-post', title: 'X title', tags: ['a', 'b'], href: '/blog/x-post' }];
  assert.match(section(buildUserPrompt({ ...input, posts: fixture }), 'Blog posts'), /^- X title\b.*\ba, b\b.*\/blog\/x-post$/);
});

test('the system prompt lists the blog as material, asks for the post link and keeps blog questions off fallback', () => {
  const p = SYSTEM_PROMPT;
  assert.match(p, /blog posts/i);
  assert.match(p, /candidate passages \(blog passages among them/);
  assert.match(p, /When the answer uses a blog post.*add that post's link \/blog\/<slug>, copied exactly as the "Blog posts" section writes it/);
  assert.match(p, /A question a blog post or blog passage answers is never "fallback"/);
  assert.doesNotMatch(p, /https?:\/\//);
  assert.doesNotMatch(p, /verified|checked/i);
});

test('a question about a post retrieves its passages and the answer comes back with its link untouched', async () => {
  const answer = 'He argues the range matters more than APR: see /blog/lp-range-over-apr';
  const provider = fakeProvider(() => ({
    content: JSON.stringify({ key: 'all', scopeId: null, answer }),
    usage: { inputTokens: 1, outputTokens: 1 },
  }));
  const res = await post(handlerWith(provider), { question: 'What does he say about LP range versus APR?', scopeId: null });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.answer, answer);

  const user = provider.calls[0].user;
  const passages = section(user, 'Candidate passages').split('\n');
  assert.ok(passages.some((line) => line.startsWith('[blog:lp-range-over-apr:')), 'a blog passage is a candidate');
  const posts = section(user, 'Blog posts');
  for (const href of ['/blog/lp-range-over-apr', '/blog/fewer-nodes-in-the-agent-workflow']) assert.ok(posts.includes(href), href);
  assert.equal(body.meta.candidates.length, TOP_K);
  assert.ok(body.meta.candidates.some((id) => id.startsWith('blog:lp-range-over-apr:')));
  assert.equal(TOP_K, 6);
  assert.equal(ANSWER_KEYS.length, 11);
});

test('the language sample travels to the prompt; the question stays the question', async () => {
  // The handler normalises only width (NFKC) and whitespace, so the sections keep the visitor's case.
  const provider = recording();
  const handler = handlerWith(provider);
  const body = { question: "What's the stack?", scopeId: 'amm', intent: 'stack', langSample: 'AMM DEX 用了什么技术' };
  assert.equal((await post(handler, body)).status, 200);
  const { langSample, ...withoutSample } = body;
  assert.equal((await post(handler, withoutSample)).status, 200);

  const [withS, withoutS] = provider.calls;
  assert.equal(section(withS.user, 'Target language sample'), langSample);
  assert.equal(section(withS.user, 'Question'), "What's the stack?");
  assert.equal(section(withoutS.user, 'Target language sample'), "What's the stack?");
  assert.equal(section(withS.user, 'Intent'), 'stack');
  assert.equal(withS.system, withoutS.system);
  assert.equal(withS.system, SYSTEM_PROMPT);
});

test('questions that differ only in form send the same bytes to the model', async () => {
  // Ruling 2026-09-14 (help gate r9): whitespace and full-width forms fold; case does not.
  assert.equal(normalizeQuestion('  Where   is the CODE? '), 'Where is the CODE?');
  assert.notEqual(normalizeQuestion('Where is the CODE?'), normalizeQuestion('where is the code?'));
  assert.equal(normalizeQuestion('ＡＭＭ ＤＥＸ'), 'AMM DEX');
  for (const [a, b] of [
    ['  Where   is the CODE? ', 'Where is the CODE?'],
    ['ＡＭＭ ＤＥＸ', 'AMM DEX'],
  ]) {
    const provider = recording();
    const handler = handlerWith(provider);
    await post(handler, { question: a, scopeId: null });
    await post(handler, { question: b, scopeId: null });
    await post(handler, { question: 'stack?', scopeId: null, intent: 'stack', langSample: a });
    await post(handler, { question: 'stack?', scopeId: null, intent: 'stack', langSample: b });
    assert.equal(provider.calls.length, 4);
    assert.equal(provider.calls[0].user, provider.calls[1].user, `${a} ≡ ${b}`);
    assert.equal(provider.calls[2].user, provider.calls[3].user, `sample ${a} ≡ ${b}`);
  }
});

test('the paraphrase fixture covers every family, four projects, four kinds of language and chip cases', () => {
  const cases = JSON.parse(read('./fixtures/ask-paraphrases.json'));
  assert.ok(cases.groups.length >= 8);
  const keys = new Set(cases.groups.map((g) => g.expect.key));
  for (const k of ['payments', 'agents', 'code', 'looking', 'contact', 'decision', 'stack', 'status']) assert.ok(keys.has(k), k);
  const scopes = new Set(cases.groups.map((g) => g.expect.scopeId).filter(Boolean));
  assert.deepEqual([...scopes].sort(), PROJECTS.map((p) => p.id).sort());
  for (const g of cases.groups) {
    const mixes = new Set(g.cases.map((c) => c.mix));
    for (const m of ['en', 'zh', 'mixed', 'other']) assert.ok(mixes.has(m), `${g.id} has ${m}`);
    assert.ok(g.cases.some((c) => c.mix === 'other' && ['ja', 'es'].includes(c.expect.lang)), `${g.id}: ja or es`);
    for (const c of g.cases) {
      assert.deepEqual(Object.keys(c.expect).sort(), ['key', 'lang', 'scopeId']);
      assert.equal(c.expect.key, g.expect.key);
      assert.equal(c.expect.scopeId, g.expect.scopeId);
      assert.equal(c.expect.lang, detectLang(c.question), `${c.question} is labelled with its own language`);
    }
  }
  assert.ok(cases.chips.length >= 3);
  const zhAfterEnglish = cases.chips.filter((c) => c.expect.lang === 'zh' && detectLang(c.langSample) === 'zh' && detectLang(c.question) === 'en');
  assert.ok(zhAfterEnglish.length >= 2, 'two Chinese conversations followed by an English chip');
  for (const c of cases.chips) {
    assert.ok(ANSWER_KEYS.includes(c.intent));
    assert.ok(['zh', 'ja'].includes(c.expect.lang));
    assert.equal(detectLang(c.langSample), c.expect.lang);
  }
});

test('detectLang and evaluate: inconsistent routing and wrong language are reported separately', async () => {
  assert.equal(detectLang('AMM DEX 使用 Node.js 与 GitHub Actions。'), 'zh');
  assert.equal(detectLang('AMM DEX は毎晩実行されます。'), 'ja');
  assert.equal(detectLang('El proyecto usa Foundry y los tests están en el repositorio.'), 'es');
  assert.equal(detectLang('It runs every night and commits STATUS.md.'), 'en');

  const cases = JSON.parse(read('./fixtures/ask-paraphrases.json'));
  const say = { zh: '这个项目每晚运行。', en: 'It runs every night.', ja: '毎晩実行されます。', es: 'El proyecto se ejecuta cada noche.' };
  const expectFor = (body) => {
    const typed = cases.groups.flatMap((g) => g.cases).find((c) => c.question === body.question);
    return typed ? typed.expect : cases.chips.find((c) => c.question === body.question && c.langSample === body.langSample).expect;
  };

  const perfect = await evaluate(cases, async (body) => {
    const e = expectFor(body);
    return { kind: 'answer', key: e.key, scopeId: e.scopeId, answer: say[e.lang], costUsd: 0.001 };
  }, { runs: 2 });
  assert.equal(perfect.ok, true, JSON.stringify(perfect.failures));
  assert.ok(Math.abs(perfect.costUsd - 0.001 * perfect.cases * 2) < 1e-9);
  assert.equal(perfect.byLang.zh.route.pass, perfect.byLang.zh.route.total);

  // One paraphrase in the stack group routes elsewhere.
  const split = await evaluate(cases, async (body) => {
    const e = expectFor(body);
    const off = body.question === '这个项目用了什么技术？';
    return { kind: 'answer', key: off ? 'fallback' : e.key, scopeId: off ? null : e.scopeId, answer: say[e.lang] };
  });
  assert.equal(split.ok, false);
  assert.deepEqual(split.failures.filter((f) => f.type === 'route-inconsistent').map((f) => f.group), ['stack-amm']);
  assert.equal(split.failures.find((f) => f.type === 'route-inconsistent').label, '路由不一致');
  assert.equal(split.failures.find((f) => f.type === 'route-wrong').answer, say.zh, 'the misrouted answer is in the report');
  assert.ok(!split.failures.some((f) => f.type === 'lang-mismatch'));

  // Right route, but the chip after a Chinese question is answered in English.
  const english = await evaluate(cases, async (body) => {
    const e = expectFor(body);
    return { kind: 'answer', key: e.key, scopeId: e.scopeId, answer: body.langSample ? say.en : say[e.lang] };
  });
  assert.equal(english.ok, false);
  const mismatches = english.failures.filter((f) => f.type === 'lang-mismatch');
  assert.ok(mismatches.length >= 2);
  assert.ok(mismatches.every((f) => f.group.startsWith('chip-') && f.label === '语言不符'));
  // The eval flagged a language once and could not show what the model wrote; now the text is in the report.
  assert.ok(mismatches.every((f) => f.answer === say.en), 'each mismatch carries the answer it judged');
  assert.ok(!english.failures.some((f) => f.type.startsWith('route')));

  const cli = spawnSync(process.execPath, ['scripts/eval-ask.mjs', '--runs', '1', '--ask', 'tests/fixtures/eval-ask-wrong.mjs'], { cwd: ROOT, encoding: 'utf8' });
  assert.notEqual(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /路由不一致/);
  assert.match(cli.stdout, /FAIL 语言不符 .*"answer":"It runs every night\."/, 'the printed report shows the answer text');
  assert.match(cli.stdout, /costUsd \d/);
  assert.match(cli.stdout, /zh: route \d+\/\d+/);
});

test('eval-ask: a missing answer reports its reason and the raw reply; token totals are printed', async () => {
  // Paid eval at 859c153: exit 1 on one structure failure that nobody could explain afterwards.
  const cases = JSON.parse(read('./fixtures/ask-paraphrases.json'));
  const raw = '{"key":"decision","scopeId":"Loop","answer":';
  let n = 0;
  const report = await evaluate(cases, async () => {
    n++;
    if (n === 1) return { kind: 'error', status: 502, reason: 'not-json', raw, costUsd: 0.001, inputTokens: 2000, outputTokens: 5 };
    return { kind: 'answer', key: 'fallback', scopeId: null, answer: 'x', costUsd: 0.001, inputTokens: 2000, outputTokens: 100 };
  });
  assert.deepEqual(report.tokens, { input: 2000 * report.cases, output: 5 + 100 * (report.cases - 1) });
  const missing = report.failures.filter((f) => f.type === 'no-answer');
  assert.equal(missing.length, 1);
  assert.equal(missing[0].status, 502);
  assert.equal(missing[0].reason, 'not-json');
  assert.equal(missing[0].raw, raw);

  const usage = { inputTokens: 1, outputTokens: 1 };
  assert.deepEqual(explain({ content: raw, usage }, 502, readModelOutput), { reason: 'not-json', raw });
  assert.deepEqual(explain({ content: '{"key":"stack","scopeId":"ghost","answer":"OK"}', usage }, 502, readModelOutput), { reason: 'bad-scope', raw: '{"key":"stack","scopeId":"ghost","answer":"OK"}' });
  assert.deepEqual(explain({ content: '{"key":"stack","scopeId":null,"answer":""}', usage }, 502, readModelOutput).reason, 'bad-answer');
  assert.deepEqual(explain({ content: '{"key":"x"}', usage }, 502, readModelOutput).reason, 'bad-key');
  assert.deepEqual(explain({ content: 'OK', usage: null }, 502, readModelOutput), { reason: 'no-usage', raw: 'OK' });
  assert.equal(explain({ error: 'ProviderError: model responded 402' }, 502, readModelOutput).reason, 'provider error (ProviderError: model responded 402)');
  assert.equal(explain(null, 504, readModelOutput).reason, 'deadline');

  const cli = spawnSync(process.execPath, ['scripts/eval-ask.mjs', '--runs', '1', '--ask', 'tests/fixtures/eval-ask-refused.mjs'], { cwd: ROOT, encoding: 'utf8' });
  assert.notEqual(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /FAIL 没有回答 .*"reason":"not-json"/);
  assert.ok(cli.stdout.includes(JSON.stringify('```json\n{"key":"decision"')), cli.stdout);
  assert.match(cli.stdout, /tokens input \d+ · output \d+/);
});

test('.env.example is tracked and complete; README documents the route, scripts and costs', () => {
  const example = read('../.env.example');
  const vars = Object.fromEntries(
    example
      .split('\n')
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  );
  for (const name of [
    'ASK_ENABLED',
    'ASK_PROVIDER',
    'ASK_MODEL_BASE_URL',
    'ASK_MODEL',
    'ASK_MODEL_API_KEY',
    'ASK_PRICE_INPUT_USD_PER_MTOK',
    'ASK_PRICE_OUTPUT_USD_PER_MTOK',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'ASK_IP_SALT',
    'ASK_DAILY_BUDGET_USD',
    'ASK_MONTHLY_BUDGET_USD',
    'ASK_VISITOR_DAILY_LIMIT',
    'ASK_MAX_QUESTION_CHARS',
    'ASK_SERVER_DEADLINE_MS',
  ]) {
    assert.ok(name in vars, name);
  }
  assert.ok(!example.includes('ASK_EMBEDDER'));
  for (const secret of ['ASK_MODEL_API_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'ASK_IP_SALT']) {
    assert.equal(vars[secret], '', `${secret} ships empty`);
  }
  assert.deepEqual(
    ['ASK_DAILY_BUDGET_USD', 'ASK_MONTHLY_BUDGET_USD', 'ASK_VISITOR_DAILY_LIMIT', 'ASK_MAX_QUESTION_CHARS'].map((n) => vars[n]),
    ['2', '20', '10', '100'],
  );

  assert.match(read('../.gitignore'), /^!\.env\.example$/m);
  // exit 1 from check-ignore means "not ignored".
  assert.equal(spawnSync('git', ['check-ignore', '-q', '.env.example'], { cwd: ROOT }).status, 1);
  assert.ok(execFileSync('git', ['check-ignore', '.env.local'], { cwd: ROOT, encoding: 'utf8' }).includes('.env.local'));

  // The guide's costs and their bounds are documented between "The guide" and "## Run".
  const readme = read('../README.md');
  const guide = readme.slice(readme.indexOf('## The guide'), readme.indexOf('## Run'));
  for (const phrase of [
    'Upstash may incur additional charges',
    'production refuses to call the model without Upstash',
    '`ASK_IP_SALT`',
    'weak per-instance limit',
    'still called for real and still billed',
    'Model calls are paid by Nolan',
  ]) {
    assert.ok(guide.includes(phrase), `README guide section: ${phrase}`);
  }
  const run = readme.slice(readme.indexOf('## Run'), readme.indexOf('## Branching'));
  for (const phrase of ['/api/ask', 'node scripts/build-ask-index.mjs', 'node scripts/eval-ask.mjs']) {
    assert.ok(run.includes(phrase), `README Run section: ${phrase}`);
  }
});
