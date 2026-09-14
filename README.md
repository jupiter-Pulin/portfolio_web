# portfolio_web

Pulin Tang's portfolio site. Next.js 16 (App Router, TypeScript, npm, no Tailwind).

## Contract

- `src/content/` — the only source of copy, links and project data (`copy.ts`, `links.ts`, `projects.ts`). Components import from here and never hardcode a second copy.
- `src/content/blog/` — blog posts, one Markdown file each, photos in `public/blog/<slug>/`. Publishing a post is adding a file; the contract is in `CONTENT.md`.
- `marked` is the one runtime dependency beyond Next/React: it turns those Markdown files into HTML at build time (`src/lib/blog.ts`). It is small, synchronous and dependency-free; a hand-written parser would have to be maintained against every post ever written.
- `tests/content.test.mjs` — red lines on that content (`node --test`, no framework).

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # content red lines, /work and /blog built-page checks
npm run lint
npm run build
```

## Branching

- `main` is protected on GitHub (ruleset `protect-main`): no direct pushes, no force-pushes, no deletion. Every change lands through a pull request. No reviewer is required — the PR is the speed bump, not a review queue.
- Day-to-day work happens on `dev` and on task branches cut from it. Loop Conductor tasks use `--base-branch dev`.
- Release = open a PR `dev → main` and merge it, then locally `git checkout main && git pull --ff-only`.
