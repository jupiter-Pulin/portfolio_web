// The /api/ask retrieval index: what gets chunked, that the committed JSON is
// exactly what the script produces, and that the hash vectors retrieve sensibly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GUIDE } from '../src/content/guide.ts';
import { LOOKING, PROJECTS, projectById } from '../src/content/projects.ts';
import { validateModelOutput } from '../src/lib/askContract.ts';
import { EMBED_DIM, chunkCorpus, cosine, hashEmbed, stripTags, topK } from '../src/lib/askIndex.ts';
import { serializeIndex } from '../scripts/build-ask-index.mjs';
import { privateFixture } from './fixtures/askPrivate.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const INDEX = fileURLToPath(new URL('../src/generated/ask-index.json', import.meta.url));
const committed = () => JSON.parse(readFileSync(INDEX, 'utf8'));

const FIELDS = ['short', 'role', 'stack', 'tagline', 'thesis', 'wrong', 'mechanism', 'qa.decision', 'qa.stack', 'qa.status'];

test('the index has a chunk for every project field, readme, LOOKING and guide item', () => {
  const index = committed();
  for (const p of PROJECTS) {
    for (const field of FIELDS) {
      assert.ok(
        index.some((c) => c.projectId === p.id && c.field === field),
        `${p.id} has a ${field} chunk`,
      );
    }
    const readme = index.filter((c) => c.projectId === p.id && c.field === 'readme');
    if (p.readme === null) assert.equal(readme.length, 0, `${p.id} has no readme chunk`);
    else assert.ok(readme.length >= 1, `${p.id} has a readme chunk`);
  }
  assert.equal(projectById('amm').readme, null);
  assert.ok(!index.some((c) => c.projectId === 'amm' && c.field === 'readme'));

  const looking = index.filter((c) => c.field === 'looking');
  assert.equal(looking.length, 1);
  assert.equal(looking[0].projectId, null);
  assert.equal(looking[0].text, LOOKING);

  for (const [field, items] of [
    ['fit', GUIDE.fit.items],
    ['agents', GUIDE.agents.items],
  ]) {
    const chunks = index.filter((c) => c.field === field);
    assert.equal(chunks.length, items.length, `${field}: one chunk per item`);
    items.forEach((item, i) => assert.equal(chunks[i].projectId, item.id ?? null, `${field}[${i}]`));
  }
  assert.equal(index.filter((c) => c.field === 'agents')[2].projectId, null, '"This guide" has no project');

  for (const c of index) {
    assert.deepEqual(Object.keys(c).sort(), ['field', 'id', 'projectId', 'text', 'vector']);
    assert.equal(c.vector.length, EMBED_DIM);
    assert.doesNotMatch(c.text, /<\/?(em|code)>/, c.id);
  }
  assert.ok(PROJECTS.some((p) => /<(em|code)>/.test(p.qa.decision)), 'the content really carries tags');
});

test('the committed index is exactly what the script builds, byte for byte', () => {
  const regenerated = chunkCorpus({ projects: PROJECTS, looking: LOOKING, guide: GUIDE }).map((c) => ({
    ...c,
    vector: hashEmbed(c.text),
  }));
  assert.deepEqual(committed(), regenerated, 'src/generated/ask-index.json is stale: run node scripts/build-ask-index.mjs');
  assert.equal(readFileSync(INDEX, 'utf8'), serializeIndex(regenerated));

  // Two runs of the script leave the file unchanged.
  const before = readFileSync(INDEX, 'utf8');
  execFileSync(process.execPath, ['scripts/build-ask-index.mjs'], { cwd: ROOT, stdio: 'ignore' });
  const once = readFileSync(INDEX, 'utf8');
  execFileSync(process.execPath, ['scripts/build-ask-index.mjs'], { cwd: ROOT, stdio: 'ignore' });
  assert.equal(readFileSync(INDEX, 'utf8'), once);
  assert.equal(once, before);
});

test('a private project contributes its scope note and never an address', () => {
  const chunks = chunkCorpus({ projects: [privateFixture()], looking: LOOKING, guide: { fit: { items: [] }, agents: { items: [] } } });
  const mine = chunks.filter((c) => c.projectId === 'secret');
  assert.ok(mine.some((c) => c.field === 'scope' && c.text.includes('Team-built; code is private.')));
  assert.ok(mine.some((c) => c.field === 'readme'), 'the readme is still chunked');
  for (const c of mine) assert.doesNotMatch(c.text, /https?:\/\//, c.id);
});

test('stripTags keeps the words and drops only <em> and <code>', () => {
  assert.equal(stripTags('a <em>b</em> <code>c</code> <b>d</b>'), 'a b c <b>d</b>');
});

test('hashEmbed is deterministic, unit length, and sees Chinese', () => {
  const text = 'AMM DEX trusts nothing but its own balances';
  const a = hashEmbed(text);
  const b = hashEmbed(text);
  assert.deepEqual(a, b);
  assert.equal(a.length, EMBED_DIM);
  for (const s of [text, '链上监控', 'x', 'Foundry tests', 'AMM DEX 使用 Foundry']) {
    const norm = Math.sqrt(hashEmbed(s).reduce((sum, x) => sum + x * x, 0));
    assert.ok(Math.abs(norm - 1) <= 1e-9, `${s}: norm ${norm}`);
  }
  assert.ok(hashEmbed('链上监控').some((x) => x !== 0), 'Han characters produce features');
  assert.ok(cosine(hashEmbed('链上监控'), hashEmbed('监控链上')) > 0);
  assert.ok(hashEmbed('').every((x) => x === 0), 'empty text is the zero vector');
});

test('cosine and topK: ordering by score, ties by id', () => {
  assert.equal(cosine([3, 4], [3, 4]), 1);
  assert.equal(cosine([1, 0], [0, 5]), 0);
  const v = hashEmbed('BlackHole');
  assert.equal(cosine(v, v), 1);

  const index = [
    { id: 'c', vector: [1, 0] },
    { id: 'a', vector: [1, 0] },
    { id: 'b', vector: [0, 1] },
    { id: 'd', vector: [1, 1] },
  ];
  assert.deepEqual(topK(index, [1, 0], 3).map((c) => c.id), ['a', 'c', 'd']);
  assert.deepEqual(topK(index, [1, 0], 10).map((c) => c.id), ['a', 'c', 'd', 'b']);
  assert.equal(topK(index, [0, 1], 2)[0].id, 'b');
  assert.deepEqual(topK(index, [1, 0], 0), []);
});

test('retrieval over the committed index finds the project a term belongs to', () => {
  const index = committed();
  for (const [query, projectId] of [
    ['Foundry tests', 'amm'],
    ['BlackHole', 'live'],
  ]) {
    assert.equal(topK(index, hashEmbed(query), 1)[0].projectId, projectId, query);
  }
});

test('validateModelOutput checks structure and nothing else', () => {
  assert.deepEqual(validateModelOutput({ key: 'stack', scopeId: 'amm', answer: '…' }), {
    key: 'stack',
    scopeId: 'amm',
    answer: '…',
  });
  assert.deepEqual(validateModelOutput('{"key":"all","scopeId":null,"answer":"…"}'), {
    key: 'all',
    scopeId: null,
    answer: '…',
  });
  for (const bad of [
    { key: 'weather', scopeId: null, answer: '…' },
    { key: 'stack', scopeId: 'ghost', answer: '…' },
    { key: 'stack', answer: '…' },
    { key: 'stack', scopeId: null },
    { key: 'stack', scopeId: null, answer: 3 },
    { key: 'stack', scopeId: null, answer: '  ' },
    { key: 'stack', scopeId: null, answer: 'x'.repeat(2001) },
    'not json',
    null,
  ]) {
    assert.equal(validateModelOutput(bad), null, JSON.stringify(bad));
  }
});
