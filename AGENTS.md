<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## This repository (added 2026-09-13)

- Copy, links and project data live only in `src/content/*.ts`; blog posts are Markdown files in `src/content/blog/` with photos in `public/blog/<slug>/` (contract in `CONTENT.md`). Never hardcode a second copy in components; if you believe the content is wrong, say so in your log instead of editing it.
- Every number shown on the site comes from `src/content/projects.ts` and keeps its provenance label (`statsNote`). Do not invent figures.
- A private project (`private: true`) shows its scope note, never a repository link.
- `npm test` is `node --test tests/*.test.mjs` (Node ≥ 22.18 strips TS types; no test framework). Add UI tests there; do not add vitest/jest.
- No new runtime dependencies without a reason written in the task log.
