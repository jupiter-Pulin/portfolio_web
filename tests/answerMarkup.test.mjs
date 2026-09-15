// answerMarkup.ts: what the drawer recognises in a model-written line. The model's
// text is never changed — joining the runs back gives the line — and nothing the
// site does not list becomes a link.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EMAIL, GITHUB, LINKEDIN, MAILTO } from '../src/content/links.ts';
import { PROJECTS } from '../src/content/projects.ts';
import { LEXICON, buildLexicon, markupLine, shortAddress, stackTerms } from '../src/lib/answerMarkup.ts';
import { modelAnswerBlocks } from '../src/lib/guideAnswer.ts';

const joined = (runs) => runs.map((r) => (r.t === 'br' ? '\n' : r.v)).join('');
const ofType = (runs, t) => runs.filter((r) => r.t === t);

test('the runs joined back are the line, for every kind of line', () => {
  const lines = [
    'Loop Conductor is a Node kernel with zero runtime dependencies.',
    `Write to ${EMAIL} or see ${GITHUB}.`,
    'Spend is capped at $2 a day and $20 a month, under a 5-second deadline.',
    '他做过 Loop Conductor、Portfolio Guide 和 Live Interpreter 三个系统。',
    '',
    'nothing to see here',
  ];
  for (const line of lines) assert.equal(joined(markupLine(line)), line);
});

test('a project name becomes an "ent" run carrying the project id, in any case, in CJK text too', () => {
  const loop = PROJECTS.find((p) => p.id === 'loop');
  const runs = markupLine(`他的${loop.name}和 ${loop.name.toUpperCase()} are the same thing.`);
  const ents = ofType(runs, 'ent');
  assert.equal(ents.length, 2);
  assert.deepEqual(ents.map((r) => r.id), ['loop', 'loop']);
  assert.equal(ents[1].v, loop.name.toUpperCase(), 'the visitor reads the model\'s own spelling');
});

test('a name inside a longer Latin word is not a project', () => {
  const runs = markupLine('AMM DEXes and the AMM DEX itself');
  assert.equal(ofType(runs, 'ent').length, 1);
});

test('stack terms come from the projects\' stack fields: short, named pieces only', () => {
  const terms = stackTerms('Node ≥ 22, zero runtime dependencies · Claude CLI subprocesses · git worktrees');
  assert.ok(terms.includes('Node ≥ 22'));
  assert.ok(!terms.includes('zero runtime dependencies'), 'a phrase with no capital or digit is prose');
  assert.ok(!terms.includes('git worktrees'));
  assert.ok(LEXICON.terms.includes('TypeScript'));
  assert.ok(!LEXICON.terms.some((t) => PROJECTS.some((p) => p.name === t)), 'a project name is an ent, never a term');
  assert.deepEqual(ofType(markupLine('Written in TypeScript on Vercel.'), 'tech').map((r) => r.v), ['TypeScript', 'Vercel']);
});

test('only addresses the site lists become links; the email opens the mailto', () => {
  const runs = markupLine(`See ${GITHUB}, ${LINKEDIN} and https://example.com/not-listed.`);
  const links = ofType(runs, 'link');
  assert.deepEqual(links.map((r) => r.href), [GITHUB, LINKEDIN]);
  assert.equal(links[0].v, GITHUB, 'the run keeps the model\'s text');
  assert.equal(shortAddress(links[0].v), 'github.com/jupiter-Pulin', 'the bubble shows it without the scheme');
  assert.equal(shortAddress(LINKEDIN), 'linkedin.com/in/nolan-tang-52b559367');
  assert.ok(joined(runs).includes('https://example.com/not-listed.'), 'an unlisted address stays text');
  assert.ok(!runs.some((r) => r.t === 'link' && r.href.includes('example.com')));

  const mail = ofType(markupLine(`Mail ${EMAIL}.`), 'link');
  assert.equal(mail.length, 1);
  assert.equal(mail[0].href, MAILTO);
  assert.equal(mail[0].mail, true);
  assert.equal(mail[0].v, EMAIL);
  assert.equal(ofType(markupLine('Mail someone@else.com.'), 'link').length, 0);
});

test('figures are "num" runs; digits glued to a name are not', () => {
  const nums = ofType(markupLine('$2 a day, $20 a month, 512 dimensions, 5-second deadline, 10 questions, MV3, V2, 2026-09-15'), 'num');
  assert.deepEqual(nums.map((r) => r.v), ['$2', '$20', '512', '5-second', '10', '2026-09-15']);
});

test('a public repository address is listed; a private project contributes none', () => {
  const lex = buildLexicon(PROJECTS);
  for (const p of PROJECTS) {
    for (const r of p.repos) assert.equal(lex.urls.has(r.url.replace(/\/+$/, '')), !p.private);
  }
});

test('modelAnswerBlocks marks each paragraph and keeps the text intact', () => {
  const answer = `Loop Conductor runs on Node.\n\nMail ${EMAIL}.`;
  const blocks = modelAnswerBlocks(answer, 'contact', null);
  const paras = blocks.filter((b) => b.kind === 'p');
  assert.equal(paras.length, 2);
  assert.equal(paras.map((b) => joined(b.runs)).join('\n'), answer.replace('\n\n', '\n'));
  assert.equal(paras[0].runs[0].t, 'ent');
  assert.ok(paras[1].runs.some((r) => r.t === 'link' && r.mail));
});
