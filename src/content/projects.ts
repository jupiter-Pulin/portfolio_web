// Project data, ported verbatim from the approved mock (design/mock/index.html).
// Rules: every figure here has a provenance (statsNote marks self-reported ledger numbers);
// BIBO stays private with the scope note; qa.* strings may contain only <em> and <code> tags.
export type Stat = { v: string; l: string };
export type Repo = { label: string; url: string };
export type Hue = 'cyan' | 'amber' | 'blue' | 'green' | 'violet';
export type Project = {
  id: string; name: string; hue: Hue; short: string; role: string; stack: string;
  tagline: string; thesis: string; wrong: string; mechanism: string;
  stats: Stat[]; statsNote?: string;
  private?: boolean; scope?: string;
  readmeUrl?: string; readmeNote?: string; repos: Repo[]; readme: string | null;
  qa: { decision: string; stack: string; status: string };
};

export const PROJECTS: Project[] = [
  {
    "id": "bibo",
    "name": "BIBO",
    "hue": "cyan",
    "short": "Recoverable multi-step on-chain transactions: receipts, not promises, advance state.",
    "role": "Full-stack development · team-built",
    "stack": "Next.js · React · TypeScript · Hono · Ponder / PostgreSQL · wagmi / viem",
    "tagline": "An on-chain asset issuance and trading platform. I delivered the core frontend and backend: market discovery, token creation, wallet trading and liquidity management.",
    "thesis": "Indexed data is fast enough to render a market; it is never trusted to authorize a trade.",
    "wrong": "A signature lands while the user has already closed the tab.",
    "mechanism": "Stages persisted before signing; only an on-chain receipt advances one.",
    "stats": [],
    "private": true,
    "scope": "Team-built product; the scope shown here is the frontend and backend I delivered. The repository is private — a walkthrough is available on request.",
    "repos": [],
    "qa": {
      "decision": "Why a receipt advances the stage, and not the UI. The wallet’s promise resolves when a transaction is <em>submitted</em>, not when it is mined, so a dropped or replaced transaction would leave the product one stage ahead of the chain. Every transition waits on a receipt and reconciles against it, and the interface only renders what the store has already confirmed. The cost is a few seconds of perceived latency; what it buys is the removal of every state in which the product and the chain disagree.",
      "stack": "Next.js, React and TypeScript on the front; Hono for the API; Ponder over PostgreSQL for indexed reads; wagmi / viem for wallet and live chain reads. Indexed data renders the market; live chain reads authorize quote, balance and ownership right before submission.",
      "status": "Team-built. Pulin describes only the frontend and backend he delivered, and the repository is private. This site makes no claim about launch or operating status."
    }
  },
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
    "statsNote": "Self-reported from Pulin’s own run ledger; the repository documents the method and the refresh command.",
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
      "status": "Open source, solo. 17 tasks run, 10 merged to main, 16/17 one-shot maker pass, $248.67 total API spend — self-reported from Pulin’s own run ledger; the README documents the method. $148.60 of that spend bought zero shipped code, and the current architecture is the response to those failures. Work packages and the plan action are not implemented yet."
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
    "id": "chain",
    "name": "chain-pulse",
    "hue": "green",
    "short": "Nightly, zero-dependency Ethereum data pipeline whose heartbeat lives in git.",
    "role": "Solo · open source · runs nightly",
    "stack": "Node ≥ 22 only · raw JSON-RPC · hand-decoded ERC-20 logs · offline fixture tests",
    "tagline": "An unattended pipeline that collects public Ethereum mainnet data and crypto funding signals every night, computes the metrics, writes a Markdown report and commits it — whether or not the run succeeded.",
    "thesis": "A pipeline that only commits on success goes quiet exactly when you need to know. The status file is committed on every run, so the heartbeat is visible in git history without a dashboard.",
    "wrong": "A public RPC endpoint flakes at 3 a.m. and nobody is watching.",
    "mechanism": "Multi-endpoint failover with backoff; STATUS.md committed on every run, success or failure.",
    "stats": [],
    "readmeUrl": "https://github.com/jupiter-Pulin/chain-pulse#readme",
    "readmeNote": "README is in Chinese today.",
    "repos": [
      {
        "label": "jupiter-Pulin/chain-pulse",
        "url": "https://github.com/jupiter-Pulin/chain-pulse"
      }
    ],
    "readme": "# chain-pulse\n\n夜间自动运行的数据管道：EVM 链上指标 + 加密融资信号，两个业务模块共享同一套无人值守基础设施（调度 / 落盘 / git 心跳 / 告警）。每晚 cron 触发：采集以太坊主网公开数据与融资 RSS → 聚合指标 → 生成 Markdown 日报 → git 固化。\n\n## 设计要点\n\n- **零依赖**：仅 Node ≥22 内置能力（`fetch`、`node --test`），不装任何 npm 包\n- **裸 JSON-RPC**：不经 ethers/web3 封装，直接走协议层（`eth_blockNumber` / `eth_feeHistory` / `eth_getBlockByNumber` / `eth_getLogs`）\n- **手工解码 ERC-20 Transfer 事件**：从 `topics` 抽 indexed 地址、从 `data` 抽 uint256 金额\n- **多端点故障转移 + 指数退避**：公共 RPC 不稳定是常态，失败换端点重试\n- **测试禁网络**：单测全部离线跑纯函数，fixture 驱动\n- **只读**：只查公开链上数据，不持有私钥、不接任何交易/下单接口\n\n## 每日产出\n\n`reports/YYYY-MM-DD.md`（另有 `reports/latest.md` 副本）…每次运行（无论成败）都会写 `reports/STATUS.md`",
    "qa": {
      "decision": "Commit the status every run, success or failure. Public RPC endpoints flake, and a pipeline that only commits on success goes quiet exactly when you need to know. chain-pulse writes <code>reports/STATUS.md</code> on every run and commits it even when collection fails, so the heartbeat — and each failure — is visible in git history without a dashboard.",
      "stack": "Node ≥ 22 only, no npm packages. Raw JSON-RPC (eth_blockNumber, eth_feeHistory, eth_getBlockByNumber, eth_getLogs), hand-decoded ERC-20 Transfer logs, multi-endpoint failover with exponential backoff, and unit tests that never touch the network.",
      "status": "Runs nightly, unattended and read-only: public Ethereum mainnet data plus a funding RSS feed, no keys, no trading endpoints. The daily report lands in <code>reports/latest.md</code>. The README is in Chinese."
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

export const LOOKING = "Backend or full-stack work on systems where being wrong has a cost — payments and settlement, trading, or the infrastructure underneath an AI product. TypeScript and Node day to day, plus a year of production experience in a team and four systems taken end to end solo. Open to relocation, and to remote.";

export const projectById = (id: string): Project | undefined => PROJECTS.find((p) => p.id === id);
