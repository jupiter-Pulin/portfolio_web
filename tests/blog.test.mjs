// The blog: the Markdown file contract (tests/fixtures/blog mirrors the repo
// layout), the pure list/filter seams, and the built /blog pages.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BLOG } from '../src/content/copy.ts';
import {
  allTags,
  escapeHtml,
  filterPosts,
  formatDate,
  groupByYear,
  parseFrontmatter,
  readingMinutes,
  resolveAsset,
} from '../src/lib/blogText.ts';
import { adjacentPosts, getPost, listPosts, renderMarkdown } from '../src/lib/blog.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const NEXT = fileURLToPath(new URL('../node_modules/.bin/next', import.meta.url));
const FIXTURE = fileURLToPath(new URL('./fixtures/blog/', import.meta.url));
const DUP = fileURLToPath(new URL('./fixtures/blog-dup/', import.meta.url));
const read = (rel) => readFileSync(`${ROOT}${rel}`, 'utf8');

const decode = (s) =>
  s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
/** Markup without the RSC payload that `next build` inlines in <script> tags. */
const markup = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' '));
const textOf = (html) =>
  markup(html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ---------- frontmatter ----------

test('frontmatter: scalars, inline lists, block lists, quotes, booleans, comments', () => {
  const { meta, body } = parseFrontmatter(
    '---\ntitle: "Quoted: title"\ntags: [a, b]\nmore:\n  - x\n  - "y"\ndraft: true\ncover: c.jpg   # comment\nkeep: "a #1"\n---\n\nBody **here**\n',
  );
  assert.deepEqual(meta, {
    title: 'Quoted: title',
    tags: ['a', 'b'],
    more: ['x', 'y'],
    draft: true,
    cover: 'c.jpg',
    keep: 'a #1',
  });
  assert.equal(body, '\nBody **here**\n');
});

test('frontmatter: a file without a header is all body', () => {
  const { meta, body } = parseFrontmatter('# Just text\n');
  assert.deepEqual(meta, {});
  assert.equal(body, '# Just text\n');
});

// ---------- pure seams ----------

test('dates render without Intl, in both lengths', () => {
  assert.equal(formatDate('2026-08-03', 'short'), 'Aug 03');
  assert.equal(formatDate('2026-08-03', 'long'), 'August 3, 2026');
  assert.equal(formatDate('2026-12-25', 'long'), 'December 25, 2026');
  assert.equal(formatDate('not-a-date', 'long'), 'not-a-date');
});

test('reading time counts latin words and CJK characters, never below one minute', () => {
  assert.equal(readingMinutes('short'), 1);
  assert.equal(readingMinutes(Array(440).fill('word').join(' ')), 2);
  assert.equal(readingMinutes('字'.repeat(800)), 2);
  assert.equal(readingMinutes('字'.repeat(400) + ' ' + Array(220).fill('w').join(' ')), 2);
  // image syntax is not prose
  assert.equal(readingMinutes('![alt text here](some-very-long-file-name.jpg)'), 1);
});

test('bare file names resolve into the post folder; URLs and root paths stay', () => {
  assert.equal(resolveAsset('photo.jpg', 'hello'), '/blog/hello/photo.jpg');
  assert.equal(resolveAsset('./photo.jpg', 'hello'), '/blog/hello/photo.jpg');
  assert.equal(resolveAsset('/projects/loop/cover.png', 'hello'), '/projects/loop/cover.png');
  assert.equal(resolveAsset('https://x.y/z.png', 'hello'), 'https://x.y/z.png');
  assert.equal(resolveAsset('data:image/png;base64,AAA', 'hello'), 'data:image/png;base64,AAA');
});

test('escapeHtml covers the five characters', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});

test('filter by search and tag, group by year, collect tags', () => {
  const posts = [
    { title: 'Alpha', summary: 'first', tags: ['a', 'b'], date: '2026-02-01' },
    { title: 'Beta', summary: 'second', tags: ['b'], date: '2026-01-01' },
    { title: 'Gamma', summary: 'third', tags: [], date: '2025-05-05' },
  ];
  assert.deepEqual(allTags(posts), ['a', 'b']);
  assert.deepEqual(filterPosts(posts, { q: '', tag: null }).map((p) => p.title), ['Alpha', 'Beta', 'Gamma']);
  assert.deepEqual(filterPosts(posts, { q: 'SECOND', tag: null }).map((p) => p.title), ['Beta']);
  assert.deepEqual(filterPosts(posts, { q: '', tag: 'b' }).map((p) => p.title), ['Alpha', 'Beta']);
  assert.deepEqual(filterPosts(posts, { q: 'gam', tag: 'b' }), []);
  assert.deepEqual(groupByYear(posts).map(([y, l]) => [y, l.length]), [['2026', 2], ['2025', 1]]);
});

// ---------- the file contract (fixture tree) ----------

test('listPosts: newest first, drafts hidden, non-post files ignored, covers resolved', () => {
  const posts = listPosts({ root: FIXTURE });
  assert.deepEqual(posts.map((p) => p.slug), ['newest', 'middle', 'oldest']);
  const [newest, middle, oldest] = posts;
  assert.equal(newest.title, 'Let the model pick the action');
  assert.equal(newest.date, '2026-08-12');
  assert.equal(newest.dateShort, 'Aug 12');
  assert.equal(newest.dateLong, 'August 12, 2026');
  assert.deepEqual(newest.tags, ['agents', 'reliability']);
  assert.equal(newest.cover, '/blog/newest/cover.jpg', 'named cover, comment stripped');
  assert.equal(newest.coverCaption, 'The whiteboard version.');
  assert.equal(middle.cover, '/blog/middle/cover.png', 'auto-detected from public/blog/<slug>/');
  assert.deepEqual(middle.tags, ['fintech', 'reliability'], 'block list');
  assert.equal(oldest.cover, null);
  assert.deepEqual(oldest.tags, ['process'], 'a single scalar tag');
  assert.equal(oldest.summary, '');
  for (const p of posts) {
    assert.equal(p.draft, false);
    assert.ok(p.minutes >= 1);
    assert.equal('body' in p, false, 'the list carries no bodies');
  }
});

test('getPost renders the body; drafts and unknown slugs are null', () => {
  const post = getPost('newest', { root: FIXTURE });
  assert.ok(post);
  assert.match(post.html, /<p>Intro paragraph with <strong>bold<\/strong> and <code>code<\/code>\.<\/p>/);
  assert.match(post.html, /<h2>Heading<\/h2>/);
  assert.match(
    post.html,
    /<figure><img src="\/blog\/newest\/photo-1\.jpg" alt="Alone" loading="lazy"><figcaption>A caption<\/figcaption><\/figure>/,
  );
  assert.match(post.html, /<div class="gallery cols-3">(<img src="\/blog\/newest\/[abc]\.jpg" alt="[A-Za-z]+" loading="lazy">){3}<\/div>/);
  assert.match(post.html, /<p>Text with <img src="https:\/\/example\.com\/x\.png" alt="inline" loading="lazy"> inside\.<\/p>/);
  assert.match(post.html, /<pre><code class="language-ts">const a = 1;\n<\/code><\/pre>/);
  assert.match(post.html, /<table>[\s\S]*<th>a<\/th>[\s\S]*<td>2<\/td>[\s\S]*<\/table>/);
  assert.equal(getPost('hidden', { root: FIXTURE }), null, 'draft');
  assert.equal(getPost('nope', { root: FIXTURE }), null);
  assert.equal(getPost('README', { root: FIXTURE }), null);
});

test('a two-image paragraph is a plain gallery; a title on the image keeps its title attribute', () => {
  const html = renderMarkdown('![a](a.jpg "ta")\n![b](b.jpg)', 's');
  assert.equal(html, '<div class="gallery"><img src="/blog/s/a.jpg" alt="a" title="ta" loading="lazy"><img src="/blog/s/b.jpg" alt="b" loading="lazy"></div>\n');
});

test('adjacent posts follow list order', () => {
  const posts = listPosts({ root: FIXTURE });
  assert.deepEqual(adjacentPosts('newest', posts), { newer: null, older: posts[1] });
  assert.deepEqual(adjacentPosts('middle', posts), { newer: posts[0], older: posts[2] });
  assert.deepEqual(adjacentPosts('oldest', posts), { newer: posts[1], older: null });
  assert.deepEqual(adjacentPosts('nope', posts), { newer: null, older: null });
});

test('two files with the same slug fail loudly', () => {
  assert.throws(() => listPosts({ root: DUP }), /Duplicate blog slug "same"/);
});

test('a missing posts folder is an empty blog, not a crash', () => {
  assert.deepEqual(listPosts({ root: `${FIXTURE}nowhere/` }), []);
});

// ---------- the built pages ----------

const DRAFT_FIXTURE = `${ROOT}src/content/blog/2000-01-01-zz-test-draft.md`;
const pages = {};

before(() => {
  // A draft dropped in before the build must not become a page.
  writeFileSync(DRAFT_FIXTURE, '---\ntitle: zz test draft\ndraft: true\n---\n\nhidden\n');
  try {
    execFileSync(NEXT, ['build'], { cwd: ROOT, encoding: 'utf8' });
  } finally {
    rmSync(DRAFT_FIXTURE, { force: true });
  }
  pages.index = read('.next/server/app/blog.html');
  pages.hello = read('.next/server/app/blog/hello.html');
  pages.home = read('.next/server/app/index.html');
});

after(() => rmSync(DRAFT_FIXTURE, { force: true }));

test('the build prerenders /blog and one static page per post, and no page for a draft', () => {
  for (const p of listPosts()) assert.ok(existsSync(`${ROOT}.next/server/app/blog/${p.slug}.html`), p.slug);
  assert.equal(existsSync(`${ROOT}.next/server/app/blog/zz-test-draft.html`), false);
});

test('the header links to the blog from every page', () => {
  for (const html of [pages.home, pages.index, pages.hello]) {
    assert.match(markup(html), /<a[^>]*href="\/blog"[^>]*>Blog<\/a>/);
  }
  assert.match(markup(pages.index), /<a[^>]*aria-current="page"[^>]*href="\/blog"/);
});

test('/blog lists the posts with title, date, tags and a link to each', () => {
  const text = textOf(pages.index);
  assert.ok(text.includes(BLOG.title), 'page title');
  assert.ok(text.includes(BLOG.lede), 'lede');
  for (const p of listPosts()) {
    assert.ok(markup(pages.index).includes(`href="/blog/${p.slug}"`), `${p.slug} link`);
    assert.ok(text.includes(p.title), `${p.slug} title`);
    assert.ok(text.includes(p.dateShort), `${p.slug} date`);
    for (const t of p.tags) assert.ok(text.includes(t), `${p.slug} tag ${t}`);
    if (p.cover) assert.ok(markup(pages.index).includes(`src="${p.cover}"`), `${p.slug} thumbnail`);
  }
});

test('/blog/hello renders the Markdown with its cover, figure and caption', () => {
  const post = getPost('hello');
  assert.ok(post, 'the starter post exists');
  const html = markup(pages.hello);
  const text = textOf(pages.hello);
  assert.match(html, new RegExp(`<h1[^>]*>${post.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
  assert.ok(text.includes(post.dateLong), 'long date');
  assert.ok(text.includes(`${post.minutes} ${BLOG.minRead}`), 'reading time');
  assert.ok(html.includes(`src="${post.cover}"`), 'cover');
  assert.match(html, /<figure><img src="\/blog\/hello\/photo-1\.svg"[^>]*><figcaption>/);
  assert.match(html, /<h2>What a post is<\/h2>/);
  assert.match(html, /<blockquote>/);
  assert.ok(html.includes(`href="/blog"`), 'back link');
});
