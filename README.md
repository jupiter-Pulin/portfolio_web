# portfolio_web

Pulin Tang's portfolio site. Next.js 16 (App Router, TypeScript, npm, no Tailwind).

## Contract

- `src/content/` — the only source of copy, links and project data (`copy.ts`, `links.ts`, `projects.ts`). Components import from here and never hardcode a second copy.
- `tests/content.test.mjs` — red lines on that content (`node --test`, no framework).

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # content red lines
npm run lint
npm run build
```

### Any question? — `/api/ask`

The site is static except for one Node route, `POST /api/ask`, which answers the
"Any question?" drawer with a paid model.

- **Cost.** Model calls are paid by Pulin and are bounded by daily / monthly budget
  thresholds (`ASK_DAILY_BUDGET_USD`, `ASK_MONTHLY_BUDGET_USD`) and a per-visitor daily
  limit; once a threshold is reached the guide stops calling the model.
- **Env.** Copy `.env.example` to `.env.local`. Every variable is server-only. Without the
  model variables the route answers 503 and the rest of the site is unaffected; the build
  needs no env at all.
- **Counters.** Production must configure Upstash (`UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN`) and `ASK_IP_SALT`, or the route refuses to call the model.
  Upstash may incur additional charges. On Vercel's multiple instances, in-memory counters
  would only be a weak per-instance limit, which is why production requires Upstash.
- **Local.** Outside production (`npm run dev`), missing Upstash env falls back to in-memory
  counters — the model is still called for real and still billed.
- **Retrieval index.** After changing `src/content`, rebuild and commit the index
  (`npm test` fails when it is stale):

  ```bash
  node scripts/build-ask-index.mjs
  ```

- **Evaluation (paid).** Checks routing and answer language across English, Chinese,
  mixed and other-language paraphrases, including chips clicked after a Chinese question:

  ```bash
  node scripts/eval-ask.mjs --runs 2
  ```

## Branching

- `main` is protected on GitHub (ruleset `protect-main`): no direct pushes, no force-pushes, no deletion. Every change lands through a pull request. No reviewer is required — the PR is the speed bump, not a review queue.
- Day-to-day work happens on `dev` and on task branches cut from it. Loop Conductor tasks use `--base-branch dev`.
- Release = open a PR `dev → main` and merge it, then locally `git checkout main && git pull --ff-only`.
