// Project data.
// Rules: every figure here has a provenance (statsNote / pointsNote say where it came from);
// a private project carries a scope note (for the assistant) and no repository link; qa.* strings may contain only <em> and <code> tags.
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
// A hand-drawn explainer video in public/projects/<id>/, shown in place of the README preview.
export type Explainer = { src: string; poster: string; caption: string };
// A diagram in public/projects/<id>/, shown full width under the case; width/height are the file's.
export type Diagram = { src: string; alt: string; caption: string; width: number; height: number };
// A drawing made in code (CASE_ART in src/lib/sketchArt.ts), keyed by `art`; its words live in ART in copy.ts.
export type Drawn = { art: string; alt: string; caption: string };
// A drawing with its own heading, shown full width under the case, in array order.
export type Figure = Drawn & { title: string };
// One card under "Under the hood": a title, one or two sentences, and optionally a figure with its label.
export type Point = { t: string; d: string; v?: string; l?: string };
// What the visitor can use today, and what is built but only verified on a mainnet fork.
export type Rollout = { live: string[]; fork: string[] };
export type Project = {
  id: string; name: string; hue: Hue; short: string; role: string; stack: string;
  tagline: string; thesis: string; wrong: string; mechanism: string;
  status?: Status; updated?: string;
  stats: Stat[]; statsNote?: string;
  private?: boolean; scope?: string;
  site?: Site; demo?: Demo; explainer?: Explainer; architecture?: Diagram | Drawn;
  rollout?: Rollout; figures?: Figure[]; points?: Point[]; pointsNote?: string;
  readmeUrl?: string; readmeNote?: string; repos: Repo[]; readme: string | null;
  qa: { decision: string; stack: string; status: string };
};

export const PROJECTS: Project[] = [
  {
    "id": "platter",
    "name": "Platter",
    "hue": "green",
    "short": "Gasless swaps on Robinhood Chain, straight into vaults like steakUSDG: you sign once, solvers bid in an auction, and the winner settles on-chain.",
    "role": "Solo · live",
    "stack": "TypeScript monorepo (pnpm, Turborepo) · Hono on Node · PostgreSQL + Drizzle · Rust (CoW services) · Solidity + Foundry · Next.js 16, wagmi, viem · Docker Compose · AWS EC2 behind Cloudflare",
    "tagline": "Gasless swaps on Robinhood Chain: you sign an order, and solvers bid in a batch auction to fill it. Vault shares such as steakUSDG sit in the same swap box, with APY and TVL beside the quote, so any token on the chain becomes a yield position in one trade. Bridging in and out of Robinhood Chain is built in.",
    "thesis": "The user signs once and pays no gas; whoever fills the order has to beat the other bids and deliver at least what was signed, or the settlement reverts.",
    "wrong": "A timed-out order gets created twice, or a settlement leaves the fee books a few wei off without anyone noticing.",
    "mechanism": "The order's UID is computed from the signed order, so a timeout is settled by looking the order up; every trade is reconciled against its on-chain transfers to within two smallest units.",
    "stats": [],
    "private": true,
    "scope": "The repository is private. The case page shows the live product at platterfi.trade, a walkthrough, and drawings of how a gasless swap is filled and settled; the code itself is not published.",
    "site": {
      "label": "platterfi.trade",
      "url": "https://platterfi.trade"
    },
    "demo": {
      "src": "/projects/platter/demo.mp4",
      "poster": "/projects/platter/demo-poster.webp",
      "caption": "48-second walkthrough: the landing page, 12 USDG turned into steakUSDG from the swap box with the wallet's confirmation, the new Earn position in the portfolio, and the vault's own page."
    },
    "rollout": {
      "live": [
        "swap",
        "bridge",
        "pools",
        "positions + PnL"
      ],
      "fork": [
        "gasless",
        "solver",
        "earn"
      ]
    },
    "figures": [
      {
        "art": "platter-fill",
        "title": "How a swap gets filled",
        "alt": "A swap box selling 1,000 USDe for about 990.9 steakUSDG with gasless on, beside a steakUSDG panel showing its APY, TVL, amount withdrawable now, share price and hourly APY dots. The signed order goes to an off-chain auction, where Platter's solver outbids three other solvers within 4 seconds, and the winning bid settles in one transaction on Robinhood Chain for at least the signed minimum.",
        "caption": "The numbers in the sketch are illustrative, taken from the Earn design mock of 2026-09-26."
      },
      {
        "art": "platter-settle",
        "title": "Inside the settlement",
        "alt": "One gasless settlement, selling USDe for steakUSDG. The wallet has approved VaultRelayer; VaultRelayer pulls the USDe into GPv2Settlement; the settlement transfers it to the executor without an approval; the executor swaps to USDG and deposits it into the vault, sends the lane fee and the clearing amount back to the settlement and the surplus straight to the user; the settlement pays the user at the clearing price and keeps the protocol fee and the lane fee.",
        "caption": "One transaction. Platter's submitter wallet pays the gas, the executor ends at zero, and every trade is reconciled against its on-chain transfers."
      }
    ],
    "points": [
      {
        "t": "Intent settlement",
        "d": "CoW's orderbook, autopilot and driver, ported to Robinhood Chain. The driver skips any settlement whose fees don't cover gas.",
        "v": "10 / 47",
        "l": "Rust crates changed"
      },
      {
        "t": "Solver",
        "d": "Orders split into 256 slices over up to 6 paths by output after gas. Aggregator quotes join the same auction as extra solver lanes.",
        "v": "17",
        "l": "DEXes · 4 s deadline"
      },
      {
        "t": "Any token to a vault",
        "d": "ERC-4626 shares are a buy token, so swap and deposit settle in one trade. Vaults are listed from factory events after a simulated deposit.",
        "v": "$100k",
        "l": "TVL to list"
      },
      {
        "t": "Reorg-safe ledger",
        "d": "Events keyed by block hash. Rollback lands only on a hash-verified ancestor, otherwise sync stops and alerts. Data and bookmark commit together.",
        "v": "4",
        "l": "real reorgs on anvil"
      },
      {
        "t": "Idempotent orders",
        "d": "The order UID is computed from the signed order. On a timeout the API looks the order up instead of reporting a failure.",
        "v": "56",
        "l": "bytes: digest, owner, validTo"
      },
      {
        "t": "Per-trade reconciliation",
        "d": "Each settlement is checked against its on-chain transfers. It caught CoW rounding the protocol fee down twice.",
        "v": "±2",
        "l": "smallest units allowed"
      },
      {
        "t": "Upstream resilience",
        "d": "eth_getLogs ranges halve and grow per chain, paid and public nodes run on separate channels, and missing data carries a reason, never 0.",
        "v": "1M+",
        "l": "pools scanned"
      },
      {
        "t": "Incident",
        "d": "Public nodes answered block-hash log queries with empty arrays and Ethereum sync was marked blocked. Reproduced on a database copy behind a faulty-node proxy, then fixed.",
        "v": "9,932 s → 47 s",
        "l": "index lag"
      },
      {
        "t": "Tests and delivery",
        "d": "Zero-secret boot check, mainnet-fork regressions, and a one-command deploy with an atomic switch and automatic rollback.",
        "v": "4,700+",
        "l": "tests"
      }
    ],
    "pointsNote": "Figures from Platter's code, test runs and incident log, as of 2026-09-28.",
    "architecture": {
      "art": "platter-arch",
      "alt": "Platter's architecture. In the browser, the web app and the wallet. On one AWS EC2 host in Singapore, behind Cloudflare and Caddy: the Next.js web server, the Hono API, PostgreSQL, and the CoW stack of orderbook, autopilot, driver with a KMS key and Platter's solver. Outside: Robinhood Chain with its DEXes and vaults, Platter's settlement and executor contracts, the aggregators and the price feeds.",
      "caption": "Solid boxes are live; dashed ones are verified on a Robinhood mainnet fork."
    },
    "repos": [],
    "readme": null,
    "qa": {
      "decision": "Run the auction off-chain and settle on-chain. The user signs an order and pays no gas; solvers bid, and the winning bid settles through a contract that checks the user gets at least the signed minimum, or the whole transaction reverts. Platter's own solver bids beside aggregator quotes, and a gasless order is offered only when the gas is at most $1 and the fee needed to cover it stays within 0.25%; otherwise the swap falls back to a transaction the wallet signs directly.",
      "stack": "A pnpm + Turborepo monorepo in strict TypeScript: <code>apps/web</code> is Next.js 16 with wagmi and viem, <code>apps/api</code> is Hono on Node with the chain sync and reconciliation, and <code>apps/solver</code> implements the CoW Solver Engine API. CoW's Rust services (orderbook, autopilot, driver) run from a fork under Docker Compose, and a forked 0x Settler is the executor, in Solidity with Foundry. PostgreSQL is reached through Drizzle, with embedded PGlite in development.",
      "status": "Live at platterfi.trade for swaps, bridging, pools and positions, on one AWS EC2 instance in Singapore behind Cloudflare; a deploy switches releases and rolls back when the new one fails its self-check. Gasless swaps, the solver and Earn are built and verified end to end on a Robinhood mainnet fork; the mainnet contracts wait on an audit sign-off and the multisigs. Solo, started on 2026-09-20."
    }
  },
  {
    "id": "loop",
    "name": "Loop Conductor",
    "hue": "amber",
    "short": "An agent-led coding workflow: a router agent decides every next step with real autonomy, the harness only runs the checks that can’t be left to an agent, and a human signs off before anything merges.",
    "role": "Solo · open source",
    "stack": "Node ≥ 22, zero runtime dependencies · Claude CLI subprocesses · git worktrees",
    "tagline": "A workflow led by agents rather than a fixed graph. A router agent reads the recorded facts and picks the next action from a closed set, so the path is its call. The harness stays out of the way except for the checks that can’t be left to an agent — tests, the budget, review bound to a commit hash — and a human approves the spec and the merge.",
    "thesis": "Review is only binding if it is bound to a commit hash. That single rule is what the rest of the kernel protects.",
    "wrong": "Code gets reviewed at one commit and merged at another.",
    "mechanism": "Approval is bound to the branch head and re-checked at the merge gate.",
    "stats": [],
    "explainer": {
      "src": "/projects/loop/explainer.mp4",
      "poster": "/projects/loop/explainer-poster.webp",
      "caption": "A narrated, hand-drawn walkthrough, under three minutes: the router agent that picks each step, the kernel that runs it and records the facts, the two gates where you sign off, and why a review only counts for the commit it read."
    },
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
      "status": "Open source and solo, and in use on Nolan’s own projects — this site’s tasks among them. Work packages and the plan action are not implemented yet."
    }
  },
  {
    "id": "guide",
    "name": "Portfolio Guide",
    "hue": "cyan",
    "short": "This site and the assistant you are talking to: a model that answers from the site's own content and stops when the budget is spent.",
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
    "readme": "# portfolio_web\n\nNolan Tang's portfolio site, live at nolan-tang.vercel.app. A static Next.js 16 site (App Router, TypeScript, no Tailwind) with one paid Node route: Nolan's assistant, which answers visitors' questions about the work, in the visitor's language, from the site's own content — and stops the moment its budget is spent. The whole site is drawn in the hand-drawn style of Nolan's explainer videos, on light or night paper.\n\n## What this is\n\n1. **An assistant backed by a paid model** — `POST /api/ask`. On the home page it walks in, waves and waits beside the identity card, and opens a chat only when clicked; on every other page it is the \"Ask my assistant\" drawer. The model reads the site's content, answers in whatever language the visitor typed, says plainly when the site does not cover something, and never acts on Nolan's behalf. An answer offers at most two follow-up questions; one about a single project also shows that project's card.\n2. **The work pages** — `/work` and one case page per project, prerendered from a single data file. A project card opens its case page wherever it is clicked. A case page can also carry the live product's link, a walkthrough video, an architecture diagram and a hand-drawn explainer video in place of the README preview. Every figure shown carries a provenance note; a private project shows a scope note and never a repository link.\n3. **A blog** — one Markdown file per post, rendered at build time. Publishing is adding a file.\n\n## The guide, end to end\n\n**Build time.** `scripts/build-ask-index.mjs` cuts `src/content` into chunks and gives each a 512-dimension feature-hashed vector. There is no embedding API and no vector store. The vectors are a pure function of the text, so the index is deterministic and committed; `npm test` regenerates it in memory and fails when the two drift.\n\n**Request time**, one Node function with every dependency injectable: validate → count, then gate (10 questions a visitor a day; $2 a day, $20 a month) → retrieve the six nearest chunks → build the prompt from content, with a language hint when the script settles it → call the model under a 5-second deadline → record the cost → check the shape of the reply. A failure is a 502 or 504 — never a made-up answer, never a scripted fallback.",
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
    "explainer": {
      "src": "/projects/live/explainer.mp4",
      "poster": "/projects/live/explainer-poster.webp",
      "caption": "A hand-drawn walkthrough, under two minutes: why nothing joins the call, the two audio paths, the original audio that never switches off, and the API key that never enters the browser."
    },
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
    "readmeNote": "The README is in Chinese; the video below walks through the project in English.",
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
      "status": "Open source, solo. macOS · Chrome ≥ 116 · Node ≥ 22. Meeting-mute sync covers Google Meet today. 45 automated tests run the whole chain against a mock backend for free; the paid real-link check is one command at about $0.05 a run. The README is in Chinese; the case page carries a hand-drawn explainer video in English."
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
  }
];

export const LOOKING = "Product-minded full-stack work on systems where being wrong has a cost — payments, trading, DeFi, or the infrastructure underneath an AI product. TypeScript and Node day to day, plus a year of production experience in a team and four systems taken end to end solo. Open to relocation, and to remote.";

export const projectById = (id: string): Project | undefined => PROJECTS.find((p) => p.id === id);
