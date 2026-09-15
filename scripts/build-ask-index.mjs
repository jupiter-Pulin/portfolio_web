// Build the /api/ask retrieval index and the post list from src/content.
//   node scripts/build-ask-index.mjs
// Output is deterministic (same content, same bytes) and committed; the test
// suite regenerates both files in memory and fails if either drifts.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GUIDE } from '../src/content/guide.ts';
import { LOOKING, PROJECTS } from '../src/content/projects.ts';
import { chunkCorpus } from '../src/lib/askIndex.ts';
import { getPost, listPosts } from '../src/lib/blog.ts';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const INDEX_PATH = fileURLToPath(new URL('../src/generated/ask-index.json', import.meta.url));
export const BLOG_CATALOGUE_PATH = fileURLToPath(new URL('../src/generated/ask-blog.json', import.meta.url));

/** One chunk per line, so a content edit shows up as a readable diff. */
export const serializeIndex = (chunks) => `[\n${chunks.map((c) => JSON.stringify(c)).join(',\n')}\n]\n`;

/** Every published post in list order, with its raw Markdown body. */
const blogPosts = (root) =>
  listPosts({ root }).map((p) => ({ slug: p.slug, title: p.title, body: getPost(p.slug, { root }).body }));

export const buildIndex = ({ root = REPO_ROOT } = {}) =>
  chunkCorpus({ projects: PROJECTS, looking: LOOKING, guide: GUIDE, posts: blogPosts(root) });

/** The post list the guide sees on every request: slug, title, tags and the in-site link. */
export const buildBlogCatalogue = ({ root = REPO_ROOT } = {}) =>
  listPosts({ root }).map((p) => ({ slug: p.slug, title: p.title, tags: p.tags, href: `/blog/${p.slug}` }));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const chunks = buildIndex();
  const posts = buildBlogCatalogue();
  mkdirSync(fileURLToPath(new URL('../src/generated/', import.meta.url)), { recursive: true });
  writeFileSync(INDEX_PATH, serializeIndex(chunks));
  writeFileSync(BLOG_CATALOGUE_PATH, serializeIndex(posts));
  console.log(`ask index: ${chunks.length} chunks → src/generated/ask-index.json`);
  console.log(`ask blog: ${posts.length} posts → src/generated/ask-blog.json`);
}
