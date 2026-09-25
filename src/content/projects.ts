// Project data.
// Rules: every figure here has a provenance (statsNote marks self-reported ledger numbers);
// a private project carries a scope note and no repository link; qa.* strings may contain only <em> and <code> tags.
export type Stat = { v: string; l: string };
export type Repo = { label: string; url: string };
export type Hue = 'cyan' | 'amber' | 'blue' | 'green' | 'violet';
// Shipping state of a record. Absent means shipped — the four approved entries
// predate the field and must not be rewritten to say so. See CONTENT.md.
export type Status = 'shipped' | 'building' | 'archived';
// The running product, when there is one to visit. Allowed on a private project:
// it is the product, not the code.
export type Site = { label: string; url: string };
// A walkthrough video in public/projects/<id>/, shown in place of the cover on the case page.
export type Demo = { src: string; poster: string; caption: string };
// A diagram in public/projects/<id>/, shown full width under the case; width/height are the file's.
export type Diagram = { src: string; alt: string; caption: string; width: number; height: number };
export type Project = {
  id: string; name: string; hue: Hue; short: string; role: string; stack: string;
  tagline: string; thesis: string; wrong: string; mechanism: string;
  status?: Status; updated?: string;
  stats: Stat[]; statsNote?: string;
  private?: boolean; scope?: string;
  site?: Site; demo?: Demo; architecture?: Diagram;
  readmeUrl?: string; readmeNote?: string; repos: Repo[]; readme: string | null;
  qa: { decision: string; stack: string; status: string };
};

export const PROJECTS: Project[] = [
  {
    "id": "loop",
    "name": "Loop Conductor",
    "hue": "amber",
    "short": "An AI coding pipeline you can walk away from: two human gates, review bound to a commit hash.",
    "role": "Solo · open source",
    "stack": "Node ≥ 22, zero runtime dependencies · Claude CLI subprocesses · git worktrees",
    "tagline": "A minimal kernel that takes a one-line brief to a reviewed, tested, locally merged commit. A router agent picks the next action from a closed set; the kernel executes and records it. A human decides twice.",
    "thesis": "Review is only binding if it is bound to a commit hash. That single rule is what the rest of the kernel protects.",
    "wrong": "Code gets reviewed at one commit and merged at another.",
    "mechanism": "Approval is bound to the branch head and re-checked at the merge gate.",
    "stats": [
      {
        "v": "17",
        "l": "Tasks run"
      },
      {
        "v": "10",
        "l": "Merged to main"
      },
      {
        "v": "16/17",
        "l": "One-shot maker pass"
      },
      {
        "v": "$248.67",
        "l": "Total API spend"
      }
    ],
    "statsNote": "Self-reported from Nolan’s own run ledger; the repository documents the method and the refresh command.",
    "readmeUrl": "https://github.com/jupiter-Pulin/loop-conductor#readme",
    "repos": [
      {
        "label": "jupiter-Pulin/loop-conductor",
        "url": "https://github.com/jupiter-Pulin/loop-conductor"
      }
    ],
    "readme": "# Loop Conductor\n\nA minimal kernel that runs an agent loop end to end: a **router agent** picks the next action from a closed set, the kernel executes it, records the facts, and stops at the two gates where a human has to decide — approving the spec, and approving the merge. Everything else — retries, budget, worktrees, the pre-commit regression, branch cleanup — is machine-owned.\n\n> Agents working inside this repo start from `AGENTS.md`, a Chinese routing index. This page is the human-facing tour.\n\n**Contents:** Architecture · What this is · State machine · Roles · Human gates · Core technical challenges · What it actually cost\n\n## Architecture\n\n![Loop Conductor system architecture](docs/assets/architecture.png)\n\nRead it top to bottom:\n\n- **Operator.** The CLI and the local dashboard are the only ways in. The dashboard holds no state of its own: it rebuilds its view from disk on every request …\n- **Kernel.** `npm run conductor -- run` is one plain Node process with no dependencies. Each scheduler step is one *routing round* …\n- **Agents.** Every spawn is a fresh `claude -p` session …\n- **Disk & git.** `state/` and `dossier/` are the source of truth, so `run` can be killed at any moment and started again …",
    "qa": {
      "decision": "One model call decides, and it decides only <em>which action</em>. The router sees the recorded facts — never the spec, the diff or the code — and returns one of eight action names. Everything with a side effect (spawning an agent, committing, opening a gate, writing state) is plain deterministic Node. A bad run is therefore either a wrong action name, which is one line in a log, or a kernel bug, which is a failing test — never both at once.",
      "stack": "Node ≥ 22 with zero runtime dependencies. Every agent spawn is a fresh <code>claude -p</code> session with fixed tools; the target repository only ever sees git worktrees and a throwaway merge candidate. <code>state/</code> and <code>dossier/</code> on disk are the source of truth, so the run can be killed at any moment and restarted.",
      "status": "Open source, solo. 17 tasks run, 10 merged to main, 16/17 one-shot maker pass, $248.67 total API spend — self-reported from Nolan’s own run ledger; the README documents the method. $148.60 of that spend bought zero shipped code, and the current architecture is the response to those failures. Work packages and the plan action are not implemented yet."
    }
  },
  {
    "id": "guide",
    "name": "Portfolio Guide",
    "hue": "cyan",
    "short": "This site and the guide you are talking to: a model that answers from the site's own content and stops when the budget is spent.",
    "role": "Solo · open source · live",
    "stack": "Next.js 16 · TypeScript · one Node route · OpenAI-compatible model (DeepSeek) · Upstash Redis · Vercel",
    "tagline": "A static portfolio with one paid route. A visitor asks in any language; the route retrieves from a locally hashed index of the site's content, hands the model the material, and returns a structured answer — or a named, counted failure. Every dollar is metered and capped.",
    "thesis": "A guide that can fail into fiction is worse than none. Every path out of the route is either a real answer from the site's content or a named failure that shows up in a counter.",
    "wrong": "The model stalls, gets cut off or answers off-script, and the visitor is shown a made-up reply.",
    "mechanism": "A 5-second deadline, JSON mode and a shape check on every reply; a failure is a counted error, never a scripted answer.",
    "stats": [],
    "readmeUrl": "https://github.com/jupiter-Pulin/portfolio_web#readme",
    "repos": [
      {
        "label": "jupiter-Pulin/portfolio_web",
        "url": "https://github.com/jupiter-Pulin/portfolio_web"
      }
    ],
    "readme": "# portfolio_web\n\nNolan Tang's portfolio site, live at nolan-tang.vercel.app. A static Next.js 16 site (App Router, TypeScript, no Tailwind) with one paid Node route: a site guide that answers visitors' questions about the work, in the visitor's language, from the site's own content — and stops the moment its budget is spent.\n\n## What this is\n\n1. **A site guide backed by a paid model** — `POST /api/ask`. On the home page it answers in place beside the identity card; on every other page it is the \"Any question?\" drawer. The model reads the site's content, answers in whatever language the visitor typed, says plainly when the site does not cover something, and never acts on Nolan's behalf.\n2. **The work pages** — `/work` and one case page per project, prerendered from a single data file. Every figure shown carries a provenance note; a private project shows a scope note and never a repository link.\n3. **A blog** — one Markdown file per post, rendered at build time. Publishing is adding a file.\n\n## The guide, end to end\n\n**Build time.** `scripts/build-ask-index.mjs` cuts `src/content` into chunks and gives each a 512-dimension feature-hashed vector. There is no embedding API and no vector store. The vectors are a pure function of the text, so the index is deterministic and committed; `npm test` regenerates it in memory and fails when the two drift.\n\n**Request time**, one Node function with every dependency injectable: validate → count, then gate (10 questions a visitor a day; $2 a day, $20 a month) → retrieve the six nearest chunks → build the prompt from content → call the model under a 5-second deadline → record the cost → check the shape of the reply. A failure is a 502 or 504 — never a made-up answer, never a scripted fallback.",
    "qa": {
      "decision": "Retrieval without an embedding API. Each content chunk gets a 512-dimension feature-hashed vector — FNV-1a over words and trigrams, characters and bigrams for CJK — so the index is a pure function of the text: deterministic, committed to git, and regenerated by the test suite, which fails when the two drift. It is cruder than a learned embedding, and that is the point: the site-wide answers are sent with every prompt anyway, the model routes and writes the answer in one call, and there is one less service that can be down, billed or out of sync with the content.",
      "stack": "Next.js 16 App Router with TypeScript; every page prerendered at build time from <code>src/content</code>, blog posts from Markdown via <code>marked</code>. One Node route, <code>/api/ask</code>, written as a plain Request → Response function with every dependency injectable: an OpenAI-compatible provider (DeepSeek today, temperature 0, JSON mode), Upstash Redis for the shared counters, and <code>node --test</code> with no framework.",
      "status": "Live at nolan-tang.vercel.app, deployed from <code>main</code> on Vercel (Tokyo) with Upstash beside it. The guide runs on a paid model behind three caps — 10 questions a visitor a day, $2 a day, $20 a month — and switches to fixed copy, never a scripted answer, once one is reached. A paid evaluation script checks routing and answer language across English, Chinese, mixed and other-language paraphrases."
    }
  },
  {
    "id": "live",
    "name": "Live Interpreter",
    "hue": "blue",
    "short": "Two-way meeting interpretation that never joins the call and never goes silent.",
    "role": "Solo · open source",
    "stack": "Chrome MV3 offscreen document · Web Audio · WebSocket · Native Messaging · Node host",
    "tagline": "Real-time two-way interpretation for Zoom, Google Meet and Teams. Nothing joins the call: the meeting app only ever sees an audio device, so the other side installs nothing and consents to nothing.",
    "thesis": "The product decision and the security decision are the same shape: put the thing that must not leak — the meeting bot, the API key — outside the surface that is exposed.",
    "wrong": "The audio device disappears mid-stream and the call goes silent.",
    "mechanism": "The original path stays open underneath; translation ducks it, never replaces it.",
    "stats": [
      {
        "v": "13",
        "l": "Output languages"
      },
      {
        "v": "45",
        "l": "Automated tests"
      },
      {
        "v": "$0.05",
        "l": "Per real-link E2E run"
      },
      {
        "v": "1",
        "l": "Runtime dependency"
      }
    ],
    "readmeUrl": "https://github.com/jupiter-Pulin/live-interpreter#readme",
    "readmeNote": "README is in Chinese today; an English version and a 60-second demo are on the to-do list.",
    "repos": [
      {
        "label": "jupiter-Pulin/live-interpreter",
        "url": "https://github.com/jupiter-Pulin/live-interpreter"
      }
    ],
    "readme": "# live-interpreter\n\nmacOS 本地实时会议同传：BlackHole 音频路由 + OpenAI `gpt-realtime-translate` 双向翻译，装成 Chrome 扩展。对会议软件（Zoom / Meet / Teams）完全透明，不入会、不装 bot。\n\n- **下行**：会议 app 输出 → BlackHole 截获 → 翻成你想听的语言 → 你的耳机\n- **上行**：你的真麦克风 → 翻成对方听的语言 → 第二块 BlackHole（虚拟麦克风）→ 会议对方\n- **原声是底，翻译是顶**：连上之后两个方向的原声一直直通；翻译播放时原声压低，停顿即恢复，任何状态都不会无声。\n\n**目录**：架构 · 部署指南 · 使用 · 核心难点解析 · 自动化测试\n\n## 架构\n\n整张图分两层看：\n\n- **音频面**（上半）：会议 app 只和两块虚拟声卡打交道 …\n- **控制面**（下半）：Service Worker 只编排，不碰音频；getUserMedia、AudioContext 和 WebSocket 全都在离屏文档里 …",
    "qa": {
      "decision": "Why the original audio is never switched off. Routing the meeting through the translator and playing only the translation is cleaner, and it is wrong: every failure in that chain — a dropped socket, a stalled model, a device that disappears — arrives at the user as silence, and silence is indistinguishable from a quiet room. So the direct path opens at connect time and stays open for the whole session; translation is mixed on top and ducks it while speaking. A total failure of the translation layer degrades to “a meeting you can hear”.",
      "stack": "Chrome MV3 with an offscreen document (the Service Worker only orchestrates; getUserMedia, AudioContext and the WebSocket live in the offscreen page), Web Audio, Native Messaging to a local Node host, and BlackHole virtual audio devices on macOS. One runtime dependency: a WebSocket library. Long-lived keys stay on the local host; the page uses short-lived credentials.",
      "status": "Open source, solo. macOS · Chrome ≥ 116 · Node ≥ 22. Meeting-mute sync covers Google Meet today. 45 automated tests run the whole chain against a mock backend for free; the paid real-link check is one command at about $0.05 a run. The README is in Chinese and the 60-second demo is not recorded yet."
    }
  },
  {
    "id": "amm",
    "name": "AMM DEX",
    "hue": "violet",
    "short": "Uniswap-V2-style AMM from scratch; the pair trusts nothing but its own balances.",
    "role": "Solo · B.Eng. capstone",
    "stack": "Solidity · Foundry · Next.js — reference architecture: Uniswap V2",
    "tagline": "A constant-product automated market maker written from scratch in Solidity — factory, pair and router — with a frontend for swapping and providing liquidity. Awarded outstanding undergraduate capstone.",
    "thesis": "The router computes the trade, but the pair re-derives it from its own balances and reverts if the invariant breaks. Correctness lives where the money is.",
    "wrong": "A caller hands the pool the wrong numbers for a swap.",
    "mechanism": "The pair re-derives every amount from its own balances and reverts on the invariant.",
    "stats": [],
    "readmeUrl": "https://github.com/jupiter-Pulin/DEX_2025_BACKEND#readme",
    "readmeNote": "README preview not captured in this mock — open it on GitHub.",
    "repos": [
      {
        "label": "DEX_2025_BACKEND · contracts",
        "url": "https://github.com/jupiter-Pulin/DEX_2025_BACKEND"
      },
      {
        "label": "DEX_2025_FRONTED · frontend",
        "url": "https://github.com/jupiter-Pulin/DEX_2025_FRONTED"
      }
    ],
    "readme": null,
    "qa": {
      "decision": "Why the tokens arrive before <code>swap()</code> is called. The caller transfers the input tokens to the pair first, and only then calls swap. It reads backwards — you hand over the money before asking for anything — and it is what lets the pair trust no one: it measures its own balance change instead of believing a parameter, so one invariant check at the end covers every path into the function at once.",
      "stack": "Solidity contracts (factory, pair, router; pair creation, swaps, add / remove liquidity, LP token mint and burn) following the Uniswap V2 architecture, a Foundry test suite for the swap and liquidity paths, and a Next.js frontend against the deployed contracts.",
      "status": "Student work — a B.Eng. capstone, solo, awarded outstanding undergraduate capstone — and a year older than the rest. It stays because it is where the habit behind the other systems started: the component holding the state validates the state itself, and never trusts a caller’s arithmetic."
    }
  },
  {
    "id": "platter",
    "name": "Platter",
    "hue": "green",
    "short": "A multi-chain DEX front end, live at platterfi.trade: swap, bridge and LP positions on three chains, with a server that never holds a key.",
    "role": "Solo · private repository · live",
    "stack": "TypeScript monorepo (pnpm, Turborepo) · Next.js 16, wagmi, viem · Hono on Node · PostgreSQL + Drizzle · AWS EC2 behind Cloudflare",
    "tagline": "One interface for liquidity on Ethereum, Base and Robinhood Chain, across Uniswap V3, Uniswap V4 and Aerodrome Slipstream: compare pools, swap or bridge on the best quote from the Uniswap API, Relay or LI.FI, and follow each LP position with its history and PnL. The backend builds every transaction; only the user's wallet signs it.",
    "thesis": "The server never holds a key. Every write path ends in an unsigned transaction handed to the wallet, so nothing moves until the user has read it there and signed it.",
    "wrong": "A position's history quietly drifts from the chain: a reorg rewrites blocks that were already indexed, or a price that could not be fetched shows up as zero.",
    "mechanism": "Each chain keeps a bookmark of block number and block hash, and a hash that no longer matches rolls the scan back. A value that cannot be fetched is null with a stated reason, never 0.",
    "stats": [],
    "private": true,
    "scope": "The repository is private. This page shows the live product at platterfi.trade, a 40-second walkthrough of it and the system architecture as deployed; the code itself is not published.",
    "site": {
      "label": "platterfi.trade",
      "url": "https://platterfi.trade"
    },
    "demo": {
      "src": "/projects/platter/demo.mp4",
      "poster": "/projects/platter/demo-poster.webp",
      "caption": "40-second walkthrough: the landing page, a pool on Robinhood Chain, adding liquidity with the wallet's confirmation, and the new position in the portfolio."
    },
    "architecture": {
      "src": "/projects/platter/architecture.webp",
      "alt": "Platter's system architecture. The browser app and the wallet; Cloudflare; one AWS EC2 host running Caddy, the Next.js web server, the Hono API and PostgreSQL; and outside services: Ethereum, Base and Robinhood Chain, the Uniswap API, Relay, LI.FI and market data. The API returns unsigned transactions; the wallet signs them and sends them straight to the chain.",
      "caption": "As deployed. The API quotes, builds unsigned transactions and owns the chain sync — one eth_getLogs per chain every 12 seconds, with a block-hash bookmark that rolls back on a reorg. PostgreSQL holds tracked addresses, scan state, position events and the token registry. Signed transactions go from the wallet straight to the chain.",
      "width": 2000,
      "height": 1280
    },
    "repos": [],
    "readme": null,
    "qa": {
      "decision": "Keep the server out of custody entirely. Swap, bridge, adding and removing liquidity all end in an unsigned transaction returned to the browser; the wallet shows it, signs it and sends it straight to the chain. There is no private key and no signing code in the backend, so the server's mistakes stop at a transaction the user can still refuse.",
      "stack": "A pnpm + Turborepo monorepo in strict TypeScript. <code>apps/web</code> is Next.js 16 with wagmi and viem; <code>apps/api</code> is Hono on Node and also runs the chain sync — one <code>eth_getLogs</code> per chain every 12 seconds, reorgs caught by a block-hash bookmark. One zod contract package is shared by both ends, protocol adapters for Uniswap V3, Uniswap V4 and Aerodrome Slipstream sit behind one interface, and PostgreSQL is reached through Drizzle (embedded PGlite in development). The whole repository builds and tests with zero secrets and the network cut off.",
      "status": "Live at platterfi.trade, solo, started on 2026-09-20. It runs on one AWS EC2 instance in Singapore behind Cloudflare; a deploy script builds on the server, switches releases and rolls back when the new one fails its self-check. The repository is private, so this page carries the product link, a 40-second walkthrough and the architecture instead."
    }
  }
];

export const LOOKING = "Backend or full-stack work on systems where being wrong has a cost — payments and settlement, trading, or the infrastructure underneath an AI product. TypeScript and Node day to day, plus a year of production experience in a team and four systems taken end to end solo. Open to relocation, and to remote.";

export const projectById = (id: string): Project | undefined => PROJECTS.find((p) => p.id === id);
