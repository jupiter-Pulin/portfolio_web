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
import { EMBED_DIM, chunkCorpus, cosine, hashEmbed, markdownText, stripTags, topK } from '../src/lib/askIndex.ts';
import { listPosts } from '../src/lib/blog.ts';
import { buildBlogCatalogue, buildIndex, serializeIndex } from '../scripts/build-ask-index.mjs';
import { privateFixture } from './fixtures/askPrivate.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const INDEX = fileURLToPath(new URL('../src/generated/ask-index.json', import.meta.url));
const CATALOGUE = fileURLToPath(new URL('../src/generated/ask-blog.json', import.meta.url));
const committed = () => JSON.parse(readFileSync(INDEX, 'utf8'));
const STALE = 'is stale: run node scripts/build-ask-index.mjs';

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

test('the committed index and post list are exactly what the script builds, byte for byte', () => {
  const regenerated = buildIndex().map((c) => ({ ...c, vector: hashEmbed(c.text) }));
  assert.deepEqual(committed(), regenerated, `src/generated/ask-index.json ${STALE}`);
  assert.equal(readFileSync(INDEX, 'utf8'), serializeIndex(regenerated), `src/generated/ask-index.json ${STALE}`);
  const catalogue = buildBlogCatalogue();
  assert.equal(readFileSync(CATALOGUE, 'utf8'), serializeIndex(catalogue), `src/generated/ask-blog.json ${STALE}`);

  // Two runs of the script leave both files unchanged.
  const before = [readFileSync(INDEX, 'utf8'), readFileSync(CATALOGUE, 'utf8')];
  execFileSync(process.execPath, ['scripts/build-ask-index.mjs'], { cwd: ROOT, stdio: 'ignore' });
  const once = [readFileSync(INDEX, 'utf8'), readFileSync(CATALOGUE, 'utf8')];
  execFileSync(process.execPath, ['scripts/build-ask-index.mjs'], { cwd: ROOT, stdio: 'ignore' });
  assert.deepEqual([readFileSync(INDEX, 'utf8'), readFileSync(CATALOGUE, 'utf8')], once);
  assert.deepEqual(once, before);
});

const REAL_SLUGS = ['fewer-nodes-in-the-agent-workflow', 'lp-range-over-apr'];
const blogChunks = (index, slug) => index.filter((c) => c.id.startsWith(`blog:${slug}:`));
const EMPTY_GUIDE = { fit: { items: [] }, agents: { items: [] } };
const fixtureChunks = (post) =>
  chunkCorpus({ projects: [], looking: '', guide: EMPTY_GUIDE, posts: [post] }).filter((c) => c.field === 'blog');
const withoutPrefix = (title, c) => {
  assert.ok(c.text.startsWith(`${title}: `), c.id);
  return c.text.slice(title.length + 2);
};

test('every published post is chunked into the index after all other chunks', () => {
  const index = committed();
  for (const slug of REAL_SLUGS) {
    const mine = blogChunks(index, slug);
    assert.ok(mine.length >= 1, `${slug} has a blog chunk`);
    mine.forEach((c, n) => {
      assert.equal(c.id, `blog:${slug}:${n}`);
      assert.match(c.id, new RegExp(`^blog:${slug}:\\d+$`));
      assert.equal(c.field, 'blog');
      assert.equal(c.projectId, null);
      assert.equal(Object.keys(c).length, 5);
      assert.equal(c.vector.length, EMBED_DIM);
    });
  }

  const rest = index.filter((c) => c.field !== 'blog');
  assert.deepEqual(rest, chunkCorpus({ projects: PROJECTS, looking: LOOKING, guide: GUIDE }));
  const lastOther = index.findLastIndex((c) => c.field !== 'blog');
  const firstBlog = index.findIndex((c) => c.field === 'blog');
  assert.ok(firstBlog > lastOther, 'blog chunks come last');
  assert.deepEqual(
    [...new Set(index.filter((c) => c.field === 'blog').map((c) => c.id.split(':')[1]))],
    listPosts({ root: ROOT }).map((p) => p.slug),
    'posts in list order',
  );
});

test('a post is chunked as plain words: no markup, images or link addresses', () => {
  const body = [
    '# 标题',
    '',
    'Some **粗体** and _斜体_ with `inlineCode42` and a [链接文字](https://example.com/x).<br>After the break.',
    '',
    '![alt](photo.webp)',
    '',
    '```ts',
    'const fenced = 7;',
    '```',
    '',
    '| 列一 | 列二 |',
    '|---|---|',
    '| 单元格甲 | 单元格乙 |',
  ].join('\n');
  const chunks = fixtureChunks({ slug: 'fixture', title: 'Fixture', body });
  assert.ok(chunks.length >= 1);
  const text = chunks.map((c) => withoutPrefix('Fixture', c)).join('\n');
  for (const gone of ['![', '](', '**', '```', '<br>', 'https://example.com/x', 'photo.webp', '|---', 'alt']) {
    assert.ok(!text.includes(gone), `no ${gone}: ${text}`);
  }
  assert.doesNotMatch(text, /^#/m);
  for (const kept of ['标题', '粗体', '斜体', '链接文字', 'inlineCode42', 'const fenced = 7;', '列一', '列二', '单元格甲', '单元格乙']) {
    assert.ok(text.includes(kept), `keeps ${kept}`);
  }
});

test('a long paragraph is cut into excerpts of at most 480 characters that lose nothing', () => {
  const sentence = '做市商在区间内持续低买高卖，手续费是承担库存风险的补偿，价格离开区间后头寸就不再赚取手续费。';
  const body = sentence.repeat(Math.ceil(1300 / sentence.length));
  assert.ok(!body.includes('\n'));
  const cleaned = markdownText(body);
  assert.ok(cleaned.length > 1200);
  const chunks = fixtureChunks({ slug: 'long', title: '长文', body });
  assert.ok(chunks.length >= 3, `${chunks.length} chunks`);
  const parts = chunks.map((c) => withoutPrefix('长文', c));
  for (const part of parts) assert.ok(part.length <= 480, `${part.length} characters`);
  assert.equal(parts.join('').replace(/\s/g, ''), cleaned.replace(/\s/g, ''));
});

test("the LP post's numbers survive chunking exactly as the author wrote them", () => {
  const raw = readFileSync(fileURLToPath(new URL('../src/content/blog/2026-09-14-lp-range-over-apr.md', import.meta.url)), 'utf8');
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/\]\([^)]*\)/g, ']');
  const numbers = body.match(/\d+(?:[.,]\d+)*%?/g);
  for (const n of ['3,000', '2,800', '3,200', '2,000', '5,000', '0.05', '100%', '30%']) assert.ok(numbers.includes(n), n);
  const title = listPosts({ root: ROOT }).find((p) => p.slug === 'lp-range-over-apr').title;
  const text = blogChunks(committed(), 'lp-range-over-apr')
    .map((c) => withoutPrefix(title, c))
    .join('\n');
  for (const n of numbers) assert.ok(text.includes(n), n);
});

test('drafts and non-post files stay out of the post list and the index; duplicate slugs fail', () => {
  const root = fileURLToPath(new URL('./fixtures/blog', import.meta.url));
  const catalogue = buildBlogCatalogue({ root });
  const index = buildIndex({ root });
  const slugs = listPosts({ root }).map((p) => p.slug);
  assert.deepEqual(catalogue.map((e) => e.slug), slugs);
  for (const e of catalogue) {
    assert.deepEqual(Object.keys(e), ['slug', 'title', 'tags', 'href']);
    assert.equal(e.href, `/blog/${e.slug}`);
  }
  const blogIds = new Set(index.filter((c) => c.field === 'blog').map((c) => c.id.split(':')[1]));
  assert.deepEqual([...blogIds].sort(), [...slugs].sort(), 'every published fixture post is chunked');
  // Project chunks come from src/content whatever the root; only the blog part depends on it.
  const everything =
    JSON.stringify(catalogue) +
    index
      .filter((c) => c.field === 'blog')
      .map((c) => `${c.id} ${c.text}`)
      .join('\n');
  for (const hidden of ['hidden', 'Not yet', 'Still writing', 'README', 'not a post', 'notes', 'scratch']) {
    assert.ok(!everything.includes(hidden), hidden);
  }

  const dup = fileURLToPath(new URL('./fixtures/blog-dup', import.meta.url));
  assert.throws(() => buildBlogCatalogue({ root: dup }), /Duplicate blog slug/);
  assert.throws(() => buildIndex({ root: dup }), /Duplicate blog slug/);
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
  const text = 'chain-pulse commits STATUS.md every night';
  const a = hashEmbed(text);
  const b = hashEmbed(text);
  assert.deepEqual(a, b);
  assert.equal(a.length, EMBED_DIM);
  for (const s of [text, '链上监控', 'x', 'Foundry tests', 'chain-pulse 使用 Node.js']) {
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
    ['STATUS.md', 'chain'],
  ]) {
    assert.equal(topK(index, hashEmbed(query), 1)[0].projectId, projectId, query);
  }
  for (const [query, slug] of [
    ['deleted nodes agent workflow Router Maker Reviewer', 'fewer-nodes-in-the-agent-workflow'],
    ['LP range APR liquidity', 'lp-range-over-apr'],
  ]) {
    assert.ok(topK(index, hashEmbed(query), 6).some((c) => c.id.startsWith(`blog:${slug}:`)), query);
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
