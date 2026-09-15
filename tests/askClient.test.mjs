// The drawer's side of /api/ask: request bodies, the language sample, reading
// replies, the transcript around one request, content-built actions, the fixed
// copy, and the wiring in AskDrawer.tsx. No DOM and no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDE } from '../src/content/guide.ts';
import { BLOG, EMAIL, GITHUB, LINKEDIN, MAILTO, X } from '../src/content/links.ts';
import { PROJECTS } from '../src/content/projects.ts';
import { ASK_CLIENT_TIMEOUT_MS } from '../src/lib/askContract.ts';
import { askBody, askGuide, copyLang, nextLangSample, pendingMsgs, settleMsgs } from '../src/lib/askClient.ts';
import {
  answerActions,
  answerBlocks,
  entryActions,
  errorBlocks,
  limitedBlocks,
  modelAnswerBlocks,
  unavailableBlocks,
} from '../src/lib/guideAnswer.ts';
import { maxQuestionChars } from '../src/server/ask/config.ts';
import { privateFixture } from './fixtures/askPrivate.mjs';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

/** A fetch that answers once with `status` and `body`, and remembers what it was given. */
const replying = (status, body) => {
  const fn = async (url, init) => {
    fn.calls.push({ url, init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  };
  fn.calls = [];
  return fn;
};

test('askGuide folds every reply into answer, limited, unavailable or error', async () => {
  const good = { ok: true, key: 'stack', scopeId: 'chain', answer: 'Node only.' };
  const f = replying(200, good);
  assert.deepEqual(await askGuide({ question: 'q', scopeId: null }, { fetch: f }), {
    kind: 'answer',
    key: 'stack',
    scopeId: 'chain',
    answer: 'Node only.',
  });
  assert.equal(f.calls[0].url, '/api/ask');
  assert.equal(f.calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(f.calls[0].init.body), { question: 'q', scopeId: null });

  const cases = [
    [429, { ok: false, error: 'limited', reason: 'visitor' }, 'limited'],
    [429, { ok: false, error: 'limited', reason: 'budget' }, 'limited'],
    [503, { ok: false, error: 'unavailable' }, 'unavailable'],
    [400, { ok: false, error: 'invalid' }, 'error'],
    [502, { ok: false, error: 'system' }, 'error'],
    [503, { ok: false, error: 'system' }, 'error'],
    [504, { ok: false, error: 'system' }, 'error'],
    [200, '<html>not json', 'error'],
    [200, { ok: true, key: 'weather', scopeId: null, answer: 'x' }, 'error'],
  ];
  for (const [status, body, kind] of cases) {
    assert.deepEqual(await askGuide({ question: 'q', scopeId: null }, { fetch: replying(status, body) }), { kind }, `${status} ${JSON.stringify(body)}`);
  }
  assert.deepEqual(await askGuide({ question: 'q', scopeId: null }, { fetch: async () => { throw new TypeError('offline'); } }), { kind: 'error' });

  let signal;
  const started = Date.now();
  const hung = await askGuide(
    { question: 'q', scopeId: null },
    { fetch: (url, init) => { signal = init.signal; return new Promise(() => {}); }, timeoutMs: 30 },
  );
  assert.deepEqual(hung, { kind: 'error' });
  assert.ok(Date.now() - started < 500);
  assert.equal(signal.aborted, true);

  assert.equal(ASK_CLIENT_TIMEOUT_MS, 6000);
  assert.match(read('../src/lib/askClient.ts'), /timeoutMs = ASK_CLIENT_TIMEOUT_MS/, 'the 6 s wait is the default');
});

test('the language sample is the last typed question; chips and picks carry it but never change it', () => {
  const typed = { via: 'typed', question: ' 技术栈是什么 ' };
  const first = askBody(typed, { scopeId: null, langSample: null });
  assert.deepEqual(first, { question: '技术栈是什么', scopeId: null });
  assert.ok(!('langSample' in first) && !('intent' in first));
  const sample = nextLangSample(null, typed);
  assert.equal(sample, '技术栈是什么');

  const chip = { via: 'chip', question: "What's the stack?", intent: 'stack' };
  assert.deepEqual(askBody(chip, { scopeId: 'chain', langSample: sample }), {
    question: "What's the stack?",
    scopeId: 'chain',
    intent: 'stack',
    langSample: '技术栈是什么',
  });
  assert.equal(nextLangSample(sample, chip), '技术栈是什么');
  assert.equal(nextLangSample(sample, { via: 'pick', question: 'chain-pulse', intent: 'decision' }), '技术栈是什么');

  const english = { via: 'typed', question: 'where is the code' };
  const after = nextLangSample(sample, english);
  assert.equal(after, 'where is the code');
  assert.equal(askBody(chip, { scopeId: null, langSample: after }).langSample, 'where is the code');
  assert.ok(!('langSample' in askBody(english, { scopeId: null, langSample: sample })), 'a typed question sends no sample');

  const cold = askBody(chip, { scopeId: null, langSample: null });
  assert.ok(!('langSample' in cold), 'nothing typed yet: no sample key');
  assert.equal(cold.intent, 'stack');
});

test('fixed copy picks zh or en from the sample, and has the wording Pulin gave', () => {
  assert.equal(copyLang('what is the stack'), 'en');
  assert.equal(copyLang('技术栈是什么'), 'zh');
  assert.equal(copyLang('chain-pulse 怎么样'), 'zh');
  assert.equal(copyLang(null), 'en');
  assert.equal(copyLang('¿Dónde está el código?'), 'en');

  assert.equal(GUIDE.systemError.zh, '系统出现了问题，请稍后重试。');
  assert.equal(GUIDE.limited.zh, '今日额度已用完');
  for (const lang of ['zh', 'en']) {
    const err = errorBlocks(lang);
    assert.deepEqual(err, [{ kind: 'p', runs: [{ t: 'text', v: GUIDE.systemError[lang] }] }]);
    assert.equal(limitedBlocks(lang)[0].runs[0].v, GUIDE.limited[lang]);
    assert.equal(unavailableBlocks(lang)[0].runs[0].v, GUIDE.unavailable[lang]);
  }
});

test('entry actions: blog placeholder, LinkedIn, X, projects — labels from content', () => {
  for (const lang of ['zh', 'en']) {
    const labels = GUIDE.entries[lang];
    const entries = entryActions(lang);
    assert.deepEqual(entries, [
      { t: 'soon', label: labels.blog },
      { t: 'link', href: LINKEDIN, label: labels.linkedin },
      { t: 'link', href: X, label: labels.x },
      { t: 'nav', href: '/work', label: labels.work },
    ]);
    assert.ok(!('href' in entries[0]));
    for (const blocks of [limitedBlocks(lang), unavailableBlocks(lang)]) {
      assert.deepEqual(blocks.find((b) => b.kind === 'actions').actions, entries);
    }
  }
  assert.equal(BLOG.href, null);
  for (const file of walk(SRC)) {
    if (!/\.(ts|tsx|css|json)$/.test(file)) continue;
    assert.doesNotMatch(readFileSync(file, 'utf8'), /https?:\/\/[^\s"'`]*blog/i, `${file} names a blog address`);
  }

  const drawer = read('../src/components/AskDrawer.tsx').replace(/\s+/g, ' ');
  assert.match(drawer, /case "soon": .*?<span className=\{`chip \$\{styles\.soon\}`\} aria-disabled="true">/, 'soon is a disabled span');
  assert.doesNotMatch(drawer.match(/case "soon":.*?<\/span>/)[0], /href|onClick|<a |<button/);
  assert.match(drawer, /closeAsk\(\); router\.push\(href\);/, 'nav closes the drawer first');
  assert.match(drawer, /case "nav": .*?onClick=\{\(\) => go\.nav\(action\.href\)\}/);
});

test('answerActions: only the clickable part of the scripted answer', () => {
  assert.deepEqual(answerActions('overview', 'chain'), [
    { kind: 'actions', actions: [{ t: 'open', id: 'chain', label: 'Open chain-pulse ↗' }] },
  ]);

  const code = answerActions('code', null)[0].actions;
  for (const p of PROJECTS.filter((p) => !p.private)) {
    for (const r of p.repos) assert.ok(code.some((a) => a.t === 'link' && a.href === r.url), r.url);
  }
  assert.ok(code.some((a) => a.t === 'link' && a.href === GITHUB));

  assert.ok(answerActions('decision', null).some((b) => b.kind === 'picks' && b.then === 'decision'));

  const contact = answerActions('contact', null)[0].actions;
  assert.ok(contact.some((a) => a.t === 'mail' && a.href === MAILTO && a.label === EMAIL));
  for (const href of [LINKEDIN, GITHUB, X]) assert.ok(contact.some((a) => a.t === 'link' && a.href === href), href);
  assert.ok(contact.some((a) => a.t === 'copy'));

  // Repeats collapse: payments lists mail and copy once each.
  const payments = answerActions('payments', null)[0].actions;
  assert.equal(new Set(payments.map((a) => JSON.stringify(a))).size, payments.length);

  assert.deepEqual(answerActions('all', null), []);
  assert.deepEqual(answerActions('fallback', null), []);

  const secret = privateFixture();
  const priv = answerActions('code', secret.id, [...PROJECTS, secret]);
  assert.ok(!JSON.stringify(priv).includes('"t":"link"'), 'a private scope offers no link');

  const answer = 'chain-pulse 每晚运行。\n\n它会提交 STATUS.md。';
  const blocks = modelAnswerBlocks(answer, 'overview', 'chain');
  assert.deepEqual(blocks, [
    { kind: 'p', runs: [{ t: 'text', v: 'chain-pulse 每晚运行。' }] },
    { kind: 'p', runs: [{ t: 'text', v: '它会提交 STATUS.md。' }] },
    ...answerActions('overview', 'chain'),
  ]);
  const scriptedText = answerBlocks('overview', 'chain').filter((b) => b.kind === 'p').map((b) => JSON.stringify(b));
  for (const b of blocks) assert.ok(!scriptedText.includes(JSON.stringify(b)), 'no scripted paragraph is shown');
});

test('the transcript around one request: placeholder, then the outcome in place', () => {
  const start = [{ key: 0, who: 'guide', blocks: [] }];
  const pending = pendingMsgs(start, '技术栈是什么');
  assert.equal(pending.length, 3);
  assert.deepEqual(pending[1], { key: 1, who: 'you', text: '技术栈是什么' });
  assert.deepEqual(pending[2], { key: 2, who: 'guide', typing: GUIDE.typing });
  assert.equal(pendingMsgs(pending, 'again'), pending, 'a second submit while in flight adds nothing');

  const answered = settleMsgs(pending, { kind: 'answer', key: 'stack', scopeId: 'chain', answer: 'Node only.' }, { scopeId: null, langSample: '技术栈是什么' });
  assert.equal(answered.scopeId, 'chain');
  assert.deepEqual(answered.msgs[2], { key: 2, who: 'guide', blocks: modelAnswerBlocks('Node only.', 'stack', 'chain') });
  assert.ok(!answered.msgs.some((m) => m.typing));
  assert.deepEqual(answered.msgs.slice(0, 2), pending.slice(0, 2));

  for (const [kind, build] of [
    ['limited', limitedBlocks],
    ['unavailable', unavailableBlocks],
    ['error', errorBlocks],
  ]) {
    const zh = settleMsgs(pending, { kind }, { scopeId: 'loop', langSample: '技术栈是什么' });
    assert.equal(zh.scopeId, 'loop', `${kind} keeps the scope`);
    assert.deepEqual(zh.msgs[2].blocks, build('zh'));
    const en = settleMsgs(pending, { kind }, { scopeId: null, langSample: null });
    assert.deepEqual(en.msgs[2].blocks, build('en'));
  }

  // The network path sets no extra timer: nothing in askClient waits TYPING_MS.
  assert.doesNotMatch(read('../src/lib/askClient.ts'), /TYPING_MS/);
});

/** The source of one `const name = useCallback(...)` in the drawer. */
const callback = (src, name) => {
  const start = src.indexOf(`const ${name} = useCallback(`);
  assert.ok(start >= 0, `${name} exists`);
  const end = src.indexOf('\n  );\n', start);
  return src.slice(start, end);
};

test('the drawer sends typed questions, chips and picks to /api/ask and nothing to the script', () => {
  const src = read('../src/components/AskDrawer.tsx');
  for (const name of ['onAsk', 'onChip', 'onPick']) {
    const body = callback(src, name);
    assert.match(body, /askBody\(/, `${name} builds the body`);
    assert.match(body, /askGuide\(/, `${name} calls the API`);
    assert.doesNotMatch(body, /\broute\(/, `${name} does not route locally`);
    assert.doesNotMatch(body, /answerBlocks\(/, `${name} renders no scripted answer`);
    assert.doesNotMatch(body, /TYPING_MS|setTimeout/, `${name} adds no artificial wait`);
  }
  assert.match(callback(src, 'onAsk'), /nextLangSample\(/);
  assert.doesNotMatch(src, /\broute\(|answerBlocks\(/, 'the drawer never calls the script');
  assert.match(src, /maxLength=\{GUIDE\.limits\.maxQuestionChars\}/);

  const flat = src.replace(/\s+/g, ' ');
  assert.match(flat, /closeAsk\(\); router\.push\(`\/work\/\$\{id\}`\);/);
  assert.match(src, /styles\.you\}`\}>\{msg\.text\}</);
  assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  assert.match(src, /role="dialog"/);

  const dir = fileURLToPath(new URL('../src/components/', import.meta.url));
  for (const f of readdirSync(dir)) {
    const text = readFileSync(join(dir, f), 'utf8');
    assert.ok(!text.includes('系统出现了问题'), f);
    assert.ok(!text.includes('今日额度已用完'), f);
    if (/\.tsx?$/.test(f)) assert.doesNotMatch(text, /\b(100|6000)\b/, `${f} spells a limit`);
  }

  assert.equal(GUIDE.limits.maxQuestionChars, 100);
  assert.equal(maxQuestionChars({}), GUIDE.limits.maxQuestionChars);
  assert.match(read('../src/server/ask/config.ts'), /"ASK_MAX_QUESTION_CHARS", GUIDE\.limits\.maxQuestionChars/);
});

test('the guide copy no longer calls itself a mock, and claims no checking', () => {
  const src = read('../src/content/guide.ts');
  const comments = [...src.matchAll(/\/\/.*$|\/\*[\s\S]*?\*\//gm)].map((m) => m[0]).join('\n');
  assert.ok(comments.length > 100, 'read the comments');
  assert.doesNotMatch(comments, /mock|scripted/i);
  for (const value of [GUIDE.pill, GUIDE.greetingFine, GUIDE.fallback, GUIDE.agents.items[2].text]) {
    assert.doesNotMatch(value, /mock|scripted/i, value);
  }
  for (const value of [GUIDE.greetingFine, GUIDE.agents.items[2].text]) {
    assert.doesNotMatch(value, /checked|verified|校验/i, value);
  }
  assert.equal(GUIDE.agents.items[2].lead, 'This guide');
  assert.equal(GUIDE.pill, 'AI · answers from site content');
  assert.equal(
    GUIDE.greetingFine,
    "Answers are written by an AI model from this site's own content, in the language you ask in. It can get things wrong — the case pages are the source. It never sends anything on Pulin's behalf.",
  );
  assert.equal(GUIDE.fallback, "That isn't something this site covers yet — try a chip, or name a project.");
  assert.equal(
    GUIDE.agents.items[2].text,
    "a model answers from the site's own content in the visitor's language, says so when the site doesn't cover something, and never acts on Pulin's behalf.",
  );
  assert.deepEqual(GUIDE.unavailable, { zh: '问答暂时关闭。', en: 'The guide is switched off for now.' });
  assert.deepEqual(GUIDE.entries.zh, { lead: '你可以先看看这些：', blog: '博客 · 即将上线', linkedin: '领英', x: '推特', work: '项目简介' });

  const drawer = read('../src/components/AskDrawer.tsx');
  const provider = drawer.slice(drawer.indexOf('/**', drawer.indexOf('export const useAsk')), drawer.indexOf('export function AskProvider'));
  assert.doesNotMatch(provider, /mock|scripted/i, 'the component comment is current');
});

test('no new runtime dependency', () => {
  const pkg = JSON.parse(read('../package.json'));
  // `marked` belongs to the blog (Markdown → HTML at build time); its reason is recorded in README.md.
  assert.deepEqual(pkg.dependencies, { marked: '^18.0.13', next: '16.3.5', react: '19.2.8', 'react-dom': '19.2.8' });
});
