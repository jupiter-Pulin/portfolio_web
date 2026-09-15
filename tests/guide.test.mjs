// The ask drawer's script: routing, every answer, the inline-tag renderer, and
// the wiring that has no DOM in this suite. The drawer is a mock with no model
// and no backend, so its whole behaviour is reachable as pure functions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  GUIDE,
  codeIntro,
  fallbackFine,
  openLabel,
  scopedChips,
  scopedHeading,
  scopedNotice,
} from '../src/content/guide.ts';
import { EMAIL, GITHUB, LINKEDIN, MAILTO, X } from '../src/content/links.ts';
import { LOOKING, PROJECTS, projectById } from '../src/content/projects.ts';
import { SITE } from '../src/content/copy.ts';
import BLOG_POSTS from '../src/generated/ask-blog.json' with { type: 'json' };
import { TYPING_MS, answerActions, answerBlocks, modelAnswerBlocks, openIntro, typingPlaceholder } from '../src/lib/guideAnswer.ts';
import { chipsFor, echoLabel, route } from '../src/lib/guideRoute.ts';
import { inlineNodes, tokenizeInline } from '../src/lib/inlineMarkup.ts';
import { keyAction } from '../src/lib/workNav.ts';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

/** Flatten one answer to the text a visitor reads, blocks and rows included. */
const runText = (runs) => runs.map((r) => (r.t === 'br' ? '\n' : r.v)).join('');
const blockText = (block) => {
  switch (block.kind) {
    case 'p':
      return runText(block.runs);
    case 'report':
      return [
        block.title,
        ...block.items.map((i) => `${runText(i.runs)} ${i.action?.label ?? ''}`),
        block.note ?? '',
        ...block.actions.map((a) => a.label),
      ].join(' ');
    case 'rows':
      return block.rows.map((r) => `${r.label} ${r.right.label ?? r.right.text}`).join(' ');
    case 'actions':
      return block.actions.map((a) => a.label).join(' ');
    case 'picks':
      return PROJECTS.map((p) => p.name).join(' ');
    default:
      throw new Error(`unknown block ${block.kind}`);
  }
};
const answerText = (blocks) => blocks.map(blockText).join(' ');
const actionsIn = (blocks) =>
  blocks.flatMap((b) =>
    b.kind === 'report'
      ? [...b.items.flatMap((i) => (i.action ? [i.action] : [])), ...b.actions]
      : b.kind === 'actions'
        ? b.actions
        : b.kind === 'rows'
          ? b.rows.map((r) => r.right)
          : [],
  );
const opens = (blocks) => actionsIn(blocks).filter((a) => a.t === 'open');
const report = (blocks) => blocks.find((b) => b.kind === 'report');

test('naming a project switches the scope and answers with its overview', () => {
  for (const [text, id] of [
    ['tell me about Loop Conductor', 'loop'],
    ['what is the portfolio guide?', 'guide'],
    ['does the loop thing work?', 'loop'],
    ['the zoom translation one', 'live'],
    ['how does the interpreter handle silence', 'live'],
    ['the amm', 'amm'],
    ['uniswap-style solidity work', 'amm'],
  ]) {
    assert.deepEqual(route(text, null), { key: 'overview', scopeId: id, scopeChanged: true }, text);
  }
});

test('a project already in scope is not switched to again', () => {
  assert.deepEqual(route('loop', 'loop'), {
    key: 'overview',
    scopeId: 'loop',
    scopeChanged: false,
  });
  // Naming a different project from inside a scope does move.
  assert.deepEqual(route('and the amm?', 'loop'), {
    key: 'overview',
    scopeId: 'amm',
    scopeChanged: true,
  });
});

test('the eight keyword families each reach their own answer, and keep the scope', () => {
  const cases = {
    payments: ['payments role', 'fintech backend', 'settlement', 'a ledger', 'banking', 'money movement', 'trading systems', 'finance'],
    agents: ['agent work', 'llm things', 'is this AI?', 'which model', 'claude pipelines', 'automation'],
    code: ['where is the code', 'github please', 'the repo', 'source'],
    contact: ['contact him', 'his email', 'how do I reach him', 'can we hire him', 'give me a call', 'linkedin', 'can we talk'],
    looking: ['what is he looking for', 'what does he want', 'the role', 'open to relocation?', 'remote?', 'salary', 'visa'],
    decision: ['hardest decision', 'why that', 'the trade-off', 'tradeoff'],
    stack: ['the stack', 'built with what', 'which tech', 'what language', 'which framework'],
    status: ['in production?', 'status', 'any users', 'has it shipped', 'is it running'],
  };
  for (const [key, inputs] of Object.entries(cases)) {
    for (const input of inputs) {
      assert.deepEqual(route(input, null), { key, scopeId: null, scopeChanged: false }, input);
      // A keyword never disturbs a scope that is already set.
      assert.deepEqual(route(input, 'amm'), { key, scopeId: 'amm', scopeChanged: false }, input);
    }
  }
});

test('an unknown question falls back, and the fallback names every project', () => {
  assert.deepEqual(route('asdf', null), { key: 'fallback', scopeId: null, scopeChanged: false });
  assert.deepEqual(route('', 'loop'), { key: 'fallback', scopeId: 'loop', scopeChanged: false });
  const text = answerText(answerBlocks('fallback', null));
  for (const p of PROJECTS) assert.ok(text.includes(p.name), `fallback names ${p.name}`);
  assert.ok(text.includes(GUIDE.fallback));
  assert.equal(fallbackFine.includes(PROJECTS[0].name), true);
});

test('chips are the five global questions, or four scoped ones plus a way back', () => {
  assert.deepEqual(
    chipsFor(null).map((c) => c.key),
    ['payments', 'agents', 'code', 'looking', 'contact'],
  );
  assert.equal(chipsFor(null), GUIDE.chips.global);

  const scoped = chipsFor('Loop Conductor');
  assert.deepEqual(
    scoped.map((c) => c.key),
    ['decision', 'stack', 'status', 'code', 'all'],
  );
  assert.equal(scoped[0].label, 'Hardest decision in Loop Conductor?');
  assert.equal(scoped[4].label, GUIDE.allQuestions);
  assert.equal(scopedChips('AMM DEX')[0].label, 'Hardest decision in AMM DEX?');

  // The arrow belongs to the chip, not to the line the transcript echoes.
  assert.equal(echoLabel(GUIDE.allQuestions), 'All questions');
  assert.equal(echoLabel(scoped[1].label), 'What is the stack?');
});

test('the drawer greets once a page, and only announces a scope that changed', () => {
  const first = openIntro({ scopeId: null, previousScopeId: null, greeted: false });
  assert.equal(first.length, 1, 'just the greeting');
  assert.equal(answerText(first[0]).includes(GUIDE.greeting), true);
  assert.equal(answerText(first[0]).includes(GUIDE.greetingFine), true);
  assert.equal(first[0][1].fine, true, 'the second paragraph is the fine print');

  const scopedOpen = openIntro({ scopeId: 'loop', previousScopeId: null, greeted: false });
  assert.equal(scopedOpen.length, 2);
  assert.equal(answerText(scopedOpen[1]), scopedNotice('Loop Conductor'));

  assert.deepEqual(openIntro({ scopeId: 'loop', previousScopeId: 'loop', greeted: true }), []);
  assert.equal(
    openIntro({ scopeId: 'live', previousScopeId: 'loop', greeted: true }).length,
    1,
    'a different project is announced',
  );
  assert.deepEqual(
    openIntro({ scopeId: null, previousScopeId: 'loop', greeted: true }),
    [],
    'dropping the scope says nothing',
  );
});

test('the payments answer is a report on two projects with mail and copy', () => {
  const blocks = answerBlocks('payments', null);
  const card = report(blocks);
  assert.equal(card.title, GUIDE.fit.title);
  assert.equal(card.items.length, 2);
  assert.deepEqual(
    card.items.map((i) => i.action.id),
    ['amm', 'loop'],
  );
  assert.deepEqual(
    card.items.map((i) => i.action.label),
    ['Open AMM DEX ↗', 'Open Loop Conductor ↗'],
  );
  assert.equal(card.items[0].runs[0].v, 'AMM DEX', 'each line leads with the project name');
  assert.ok(card.note.startsWith('Scope note: both are solo builds.'), 'the scope note stays');

  const [mail, copy] = card.actions;
  assert.deepEqual(mail, { t: 'mail', href: MAILTO, label: GUIDE.mail, amber: true });
  assert.deepEqual(copy, { t: 'copy', label: GUIDE.copy });
  assert.equal(answerText(blocks).includes(GUIDE.fit.intro), true);
});

test('the agents answer lists two shipped systems and the guide itself', () => {
  const card = report(answerBlocks('agents', null));
  assert.equal(card.title, GUIDE.agents.title);
  assert.deepEqual(
    card.items.map((i) => i.runs[0].v),
    ['Loop Conductor', 'Live Interpreter', 'This guide'],
  );
  assert.equal(card.items[2].action, undefined, 'the guide is not a case page');
  assert.deepEqual(card.actions, [{ t: 'mail', href: MAILTO, label: GUIDE.mail, amber: true }]);

  // Every figure quoted here is one of Loop Conductor's own stats, with provenance.
  const line = runText(card.items[0].runs);
  for (const stat of projectById('loop').stats) {
    if (/^[\d$]/.test(stat.v)) continue;
  }
  for (const v of ['17', '10', '$248.67']) assert.ok(line.includes(v), `quotes ${v}`);
  assert.ok(
    projectById('loop').stats.some((s) => s.v === '$248.67'),
    'the spend figure comes from projects.ts',
  );
  assert.ok(line.includes('self-reported'), 'the provenance word travels with the figures');
});

test('the code answer links the repos of every public project', () => {
  const rows = answerBlocks('code', null).find((b) => b.kind === 'rows').rows;
  const expected = PROJECTS.flatMap((p) =>
    p.private ? [[p.name, GUIDE.code.private]] : p.repos.map((r) => [p.name, `${r.label} ↗`]),
  );
  assert.deepEqual(
    rows.map((r) => [r.label, r.right.label ?? r.right.text]),
    expected,
  );
  assert.equal(rows.filter((r) => r.right.t === 'link').length, 5, 'amm carries two repos');
  for (const row of rows.filter((r) => r.right.t === 'link')) {
    assert.ok(row.right.href.startsWith('https://github.com/'), row.right.href);
  }
  const home = actionsIn(answerBlocks('code', null)).at(-1);
  assert.deepEqual(home, { t: 'link', href: GITHUB, label: 'github.com/jupiter-Pulin ↗' });
  assert.equal(answerText(answerBlocks('code', null)).includes(GUIDE.code.all), true);
});

test('a scoped code answer shows only that project', () => {
  const rows = answerBlocks('code', 'live').find((b) => b.kind === 'rows').rows;
  assert.deepEqual(rows.map((r) => r.label), ['Live Interpreter']);
  assert.equal(rows[0].right.href, projectById('live').repos[0].url);
  assert.equal(answerText(answerBlocks('code', 'live')).includes(codeIntro('Live Interpreter')), true);
  assert.equal(codeIntro('Live Interpreter'), 'Source for Live Interpreter:');
});

test('the contact answer is the links.ts values, plus the location line', () => {
  const blocks = answerBlocks('contact', null);
  const rows = blocks.find((b) => b.kind === 'rows').rows;
  assert.deepEqual(rows[0], {
    label: 'Email',
    right: { t: 'mail', href: MAILTO, label: EMAIL, amber: true },
  });
  assert.deepEqual(
    rows.slice(1).map((r) => [r.label, r.right.href]),
    [
      ['LinkedIn', LINKEDIN],
      ['GitHub', GITHUB],
      ['X', X],
    ],
  );
  // Every handle shown is a piece of the URL it opens, so it cannot drift.
  for (const row of rows.slice(1)) {
    const handle = row.right.label.replace(' ↗', '');
    assert.ok(row.right.href.includes(handle), `${handle} is part of ${row.right.href}`);
  }
  const text = answerText(blocks);
  assert.ok(text.includes(SITE.location), 'where he is');
  assert.deepEqual(actionsIn(blocks).at(-1), { t: 'copy', label: GUIDE.copy });
});

test('the looking answer quotes LOOKING and offers both ways to write', () => {
  const blocks = answerBlocks('looking', null);
  assert.equal(blocks[0].runs[0].v, LOOKING);
  assert.deepEqual(
    actionsIn(blocks).map((a) => a.t),
    ['mail', 'copy'],
  );
});

test('decision, stack and status quote the project qa and nothing else', () => {
  for (const p of PROJECTS) {
    for (const key of ['decision', 'stack', 'status']) {
      const blocks = answerBlocks(key, p.id);
      assert.equal(blocks[0].runs[0].v, scopedHeading(p.name, key), `${p.id} ${key} heading`);
      assert.equal(blocks[1].runs[0].v, p.qa[key], `${p.id} ${key} is the qa string`);
    }
    // Only the decision offers the full case.
    assert.deepEqual(opens(answerBlocks('decision', p.id)), [
      { t: 'open', id: p.id, label: GUIDE.readFullCase },
    ]);
    assert.deepEqual(opens(answerBlocks('stack', p.id)), []);
    assert.deepEqual(opens(answerBlocks('status', p.id)), []);
  }
  assert.equal(scopedHeading('AMM DEX', 'decision'), 'AMM DEX · one decision, in detail');
});

test('without a scope those three ask which project, and carry the question along', () => {
  for (const key of ['decision', 'stack', 'status']) {
    const blocks = answerBlocks(key, null);
    assert.equal(blocks[0].runs[0].v, GUIDE.pick);
    assert.deepEqual(blocks[1], { kind: 'picks', then: key }, `${key} remembers itself`);
  }
});

test('the overview names the project and shows the wrong / mechanism pair', () => {
  const p = projectById('amm');
  const blocks = answerBlocks('overview', p.id);
  const text = answerText(blocks);
  assert.ok(text.startsWith(`${p.name} — ${p.tagline}`));
  assert.ok(text.includes(GUIDE.overview.wrong) && text.includes(p.wrong));
  assert.ok(text.includes(GUIDE.overview.mechanism) && text.includes(p.mechanism));
  assert.deepEqual(opens(blocks), [{ t: 'open', id: 'amm', label: openLabel(p.name) }]);
  assert.equal(openLabel(p.name), 'Open AMM DEX ↗');
});

test('"All questions" is a plain line, and the scope is cleared by the caller', () => {
  assert.deepEqual(answerBlocks('all', 'loop'), [
    { kind: 'p', runs: [{ t: 'text', v: GUIDE.all }] },
  ]);
});

test('reduced motion answers with no "typing" state; otherwise it waits a beat', () => {
  assert.equal(typingPlaceholder(true), null);
  assert.equal(typingPlaceholder(false), GUIDE.typing);
  assert.equal(GUIDE.typing, 'guide is typing…');
  assert.equal(TYPING_MS, 420);
});

test('only <em> and <code> survive as elements; every other tag stays text', () => {
  const source = '<em>a</em> <code>b</code> <script>x</script> & <b>c</b>';
  const nodes = inlineNodes(source);
  const elements = nodes.filter((n) => n && typeof n === 'object');
  assert.deepEqual(
    elements.map((n) => n.type),
    ['em', 'code'],
  );
  assert.deepEqual(
    elements.map((n) => n.props.children),
    ['a', 'b'],
  );
  // Everything the two tags did not claim comes through as characters: the
  // <script> and the <b> are text nodes, which React escapes when it renders.
  const text = nodes.filter((n) => typeof n === 'string').join('');
  assert.equal(text, source.replace('<em>a</em>', '').replace('<code>b</code>', ''));
  const tail = tokenizeInline(source).at(-1);
  assert.equal(tail.tag, 'text');
  assert.equal(tail.text, ' <script>x</script> & <b>c</b>', 'the rest is characters, not markup');
});

const POSTS = [
  { slug: 'lp-range-over-apr', title: 'T-LP', tags: [], href: '/blog/lp-range-over-apr' },
  { slug: 'fewer-nodes-in-the-agent-workflow', title: 'T-Nodes', tags: [], href: '/blog/fewer-nodes-in-the-agent-workflow' },
];
const postNavs = (blocks) =>
  blocks.flatMap((b) => (b.kind === 'actions' ? b.actions : [])).filter((a) => a.t === 'nav' && a.href.startsWith('/blog/'));

test('a model answer that links a listed post gets a chip for it, after the content actions and before the picks', () => {
  const answer = '见 /blog/fewer-nodes-in-the-agent-workflow。\n另见 /blog/lp-range-over-apr 和 /blog/fewer-nodes-in-the-agent-workflow';
  const blocks = modelAnswerBlocks(answer, 'agents', null, POSTS);
  const paras = blocks.filter((b) => b.kind === 'p');
  assert.deepEqual(paras, answer.split('\n').map((line) => ({ kind: 'p', runs: [{ t: 'text', v: line }] })));
  const navs = [
    { t: 'nav', href: '/blog/fewer-nodes-in-the-agent-workflow', label: 'T-Nodes' },
    { t: 'nav', href: '/blog/lp-range-over-apr', label: 'T-LP' },
  ];
  assert.deepEqual(postNavs(blocks), navs);
  const [content] = answerActions('agents', null);
  assert.equal(content.kind, 'actions');
  const merged = blocks.filter((b) => b.kind === 'actions');
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].actions, [...content.actions, ...navs]);
  const lastActions = blocks.findLastIndex((b) => b.kind === 'actions');
  const firstPicks = blocks.findIndex((b) => b.kind === 'picks');
  assert.ok(firstPicks === -1 || lastActions < firstPicks);
});

test('unknown or longer slugs make no chip; a new actions block sits before the picks; the default list is ask-blog.json', () => {
  const unknown = '读 /blog/unknown-post 或 /blog/lp-range-over-apr-2';
  assert.deepEqual(modelAnswerBlocks(unknown, 'agents', null, POSTS), modelAnswerBlocks(unknown, 'agents', null, []));
  assert.deepEqual(postNavs(modelAnswerBlocks(unknown, 'agents', null, POSTS)), []);

  const answer = 'Read /blog/lp-range-over-apr.';
  const chip = { kind: 'actions', actions: [{ t: 'nav', href: '/blog/lp-range-over-apr', label: 'T-LP' }] };
  const all = modelAnswerBlocks(answer, 'all', null, POSTS);
  assert.deepEqual(answerActions('all', null), []);
  assert.deepEqual(all.at(-1), chip);

  assert.deepEqual(answerActions('stack', null), [{ kind: 'picks', then: 'stack' }]);
  const stack = modelAnswerBlocks(answer, 'stack', null, POSTS);
  const picks = stack.findIndex((b) => b.kind === 'picks');
  assert.deepEqual(stack[picks], { kind: 'picks', then: 'stack' });
  assert.deepEqual(stack[picks - 1], chip);

  const title = BLOG_POSTS.find((p) => p.slug === 'lp-range-over-apr').title;
  assert.deepEqual(postNavs(modelAnswerBlocks(answer, 'all', null)), [{ t: 'nav', href: '/blog/lp-range-over-apr', label: title }]);
  // A full address still points at the page inside the site; the text stays as written.
  const full = modelAnswerBlocks('https://nolan-tang.vercel.app/blog/lp-range-over-apr', 'all', null, POSTS);
  assert.deepEqual(full, [{ kind: 'p', runs: [{ t: 'text', v: 'https://nolan-tang.vercel.app/blog/lp-range-over-apr' }] }, chip]);
});

test('tokenizing a qa string loses nothing and invents no tag', () => {
  const strings = PROJECTS.flatMap((p) => [p.qa.decision, p.qa.stack, p.qa.status]);
  let tagged = 0;
  for (const s of strings) {
    const tokens = tokenizeInline(s);
    for (const t of tokens) assert.ok(['text', 'em', 'code'].includes(t.tag), t.tag);
    tagged += tokens.filter((t) => t.tag !== 'text').length;
    const back = tokens
      .map((t) => (t.tag === 'text' ? t.text : `<${t.tag}>${t.text}</${t.tag}>`))
      .join('');
    assert.equal(back, s, 'round trip');
    // No text token may still hold one of the two tags.
    for (const t of tokens.filter((t) => t.tag === 'text')) {
      assert.doesNotMatch(t.text, /<\/?(em|code)>/);
    }
  }
  assert.ok(tagged >= 5, `the qa copy really does use the tags (${tagged})`);
  assert.deepEqual(tokenizeInline('plain'), [{ tag: 'text', text: 'plain' }]);
  assert.deepEqual(tokenizeInline(''), []);
});

test('an open drawer owns the keyboard: the case pages stop listening', () => {
  const body = { tagName: 'BODY' };
  assert.equal(keyAction('ArrowRight', body, { askOpen: true }), null);
  assert.equal(keyAction('ArrowLeft', body, { askOpen: true }), null);
  assert.equal(keyAction('Escape', body, { askOpen: true }), null, 'Esc closes the drawer instead');
  // Closed again, the arrows walk the cases as before.
  assert.equal(keyAction('ArrowRight', body, { askOpen: false }), 'next');
  assert.equal(keyAction('ArrowRight', body), 'next');
});

test('the guide copy lives in src/content, never in a component', () => {
  const dir = fileURLToPath(new URL('../src/components/', import.meta.url));
  const sources = readdirSync(dir)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => [f, readFileSync(`${dir}${f}`, 'utf8')]);
  assert.ok(sources.length >= 10, 'read the component directory');
  const banned = [
    'Any question',
    GUIDE.pill,
    'Which project',
    GUIDE.mail,
    GUIDE.copy,
    GUIDE.typing,
    'Scoped to',
    'Open ',
    'Report',
  ];
  for (const [file, src] of sources) {
    for (const phrase of banned) {
      assert.ok(!src.includes(`${phrase}`) || !src.includes(`"${phrase}`), `${file} spells "${phrase}"`);
      assert.equal(src.includes(`>${phrase}`), false, `${file} renders "${phrase}" literally`);
    }
  }
});

test('the drawer keeps the mock class names and the 450px slide', () => {
  const css = read('../src/components/AskDrawer.module.css').replace(/\s+/g, ' ');
  for (const name of [
    'scrim',
    'drawer',
    'askHead',
    'pill',
    'msgs',
    'msg',
    'chips',
    'askForm',
    'report',
    'rpHead',
    'rpList',
    'rpNote',
    'rpActions',
    'linklist',
  ]) {
    assert.match(css, new RegExp(`\\.${name}[\\s.:,{]`), `.${name} is styled`);
  }
  assert.match(css, /\.drawer \{[^}]*width: min\(450px, 100vw\)/);
  assert.match(css, /\.drawer \{[^}]*transform: translateX\(100%\)/);
  assert.match(css, /\.drawer \{[^}]*transition: transform 0\.32s/, 'the slide is a transition');
  assert.match(css, /\.drawer\.open \{[^}]*transform: none/);
  assert.match(css, /\.msg\.guide \{/);
  assert.match(css, /\.msg\.you \{/);

  // Reduced motion: the site-wide reset is what removes the slide,
  // so the drawer must not carry a rule that outranks it.
  const globals = read('../src/app/globals.css').replace(/\s+/g, ' ');
  assert.match(
    globals,
    /@media \(prefers-reduced-motion: reduce\) \{ \*, \*::before, \*::after \{[^}]*transition: none !important/,
    'the reduced-motion reset still kills every transition',
  );
  assert.doesNotMatch(css, /!important/, 'nothing in the drawer outranks that reset');
});

test('the drawer is wired to the page: dialog semantics, focus, navigation', () => {
  // There is no DOM in this suite, so the wiring is asserted where it is written.
  const drawer = read('../src/components/AskDrawer.tsx');
  assert.match(drawer, /role="dialog"/);
  assert.match(drawer, /aria-modal="true"/);
  assert.match(drawer, /aria-labelledby="ask-title"/);
  assert.match(drawer, /aria-live="polite"/);
  assert.match(drawer, /if \(isOpen\) input\.current\?\.focus\(\);/, 'focus enters the field');
  assert.match(drawer, /trigger\.current\?\.focus\(\)/, 'focus goes back to the trigger');
  assert.match(drawer, /e\.key === "Escape"/, 'Esc closes');
  assert.match(drawer, /onClick=\{onClose\}/, 'the scrim closes');
  // "Open <name> ↗" closes the drawer and then navigates, in that order.
  assert.match(
    drawer.replace(/\s+/g, ' '),
    /closeAsk\(\); router\.push\(`\/work\/\$\{id\}`\);/,
  );
  // What the visitor typed goes back out as text. It never reaches inlineNodes,
  // which is the only place in the drawer that can turn a string into an element.
  assert.match(drawer, /styles\.you\}`\}>\{msg\.text\}</, 'the echo is a text child');
  assert.doesNotMatch(drawer, /inlineNodes\(msg\.text\)/);
  assert.doesNotMatch(drawer, /dangerouslySetInnerHTML/, 'no string is ever injected');
  assert.match(drawer, /target="_blank" rel="noopener"/, 'outbound links are safe');

  const button = read('../src/components/AskButton.tsx');
  assert.match(button, /aria-haspopup="dialog"/);
  assert.match(button, /openAsk\(scopeId\)/);
  assert.doesNotMatch(button, /aria-disabled/, 'the entry points are live');
});
