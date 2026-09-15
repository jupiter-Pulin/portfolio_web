// Build the /api/ask retrieval index from src/content.
//   node scripts/build-ask-index.mjs
// Output is deterministic (same content, same bytes) and committed; the test
// suite regenerates it in memory and fails if the two drift.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GUIDE } from '../src/content/guide.ts';
import { LOOKING, PROJECTS } from '../src/content/projects.ts';
import { chunkCorpus } from '../src/lib/askIndex.ts';

export const INDEX_PATH = fileURLToPath(new URL('../src/generated/ask-index.json', import.meta.url));

/** One chunk per line, so a content edit shows up as a readable diff. */
export const serializeIndex = (chunks) => `[\n${chunks.map((c) => JSON.stringify(c)).join(',\n')}\n]\n`;

export const buildIndex = () => chunkCorpus({ projects: PROJECTS, looking: LOOKING, guide: GUIDE });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const chunks = buildIndex();
  mkdirSync(fileURLToPath(new URL('../src/generated/', import.meta.url)), { recursive: true });
  writeFileSync(INDEX_PATH, serializeIndex(chunks));
  console.log(`ask index: ${chunks.length} chunks → src/generated/ask-index.json`);
}
