// Page copy.
export const SITE = {
  name: 'Nolan Tang',
  wordmark: 'Nolan',
  title: 'Nolan Tang',
  location: 'Open to relocation and to remote',
  description:
    'Nolan Tang, a product-minded software engineer with experience in fintech, blockchain and AI. Ask his assistant about the work, the stack, or how to reach him.',
  askLabel: 'Ask my assistant',
  workNav: 'Work',
  workTitle: 'Selected Work',
  workSubtitle: 'Four systems, one recurring problem: keeping state correct when the environment is not reliable.',
  stripOpenAll: 'open all →',
  footNote: "Drawn by hand, built with Next.js · answers from Nolan's assistant are written by an AI model.",
  imageSlot: 'image slot · replace with a product screenshot',
} as const;

// Chrome for the /work screens.
export const WORK = {
  learnMore: 'Learn more →',
  readmeLink: 'README ↗',
  allWork: '← All work',
  close: 'Close',
  prev: '← Previous',
  next: 'Next →',
  wrong: 'What goes wrong unattended',
  mechanism: 'The mechanism I built',
  stackLabel: 'Stack',
  readmeFile: 'README.md',
  askProject: 'Any question about this project?',
  openReadme: 'Open README on GitHub ↗',
  visitSite: 'Visit',
  demoLabel: 'walkthrough video',
  explainerFile: 'The project, explained',
  explainerLabel: 'explainer video',
  architecture: 'Architecture',
  openFullSize: 'Open full size ↗',
  rolloutLive: 'Live',
  rolloutFork: 'Mainnet fork',
  points: 'Under the hood',
} as const;

// The identity card on the home page, in Nolan's words: what he is after, what he
// is betting on, what he is strongest at, and what he does off hours. The assistant is
// given these too (prompt.ts).
export const IDENTITY = {
  status: 'Open to work',
  role: 'Product-minded software engineer · fintech × web3 × AI',
  avatarAlt: 'Nolan Tang',
  facts: [
    {
      label: 'Looking for',
      text: 'Product-minded full-stack work where being wrong has a cost: payments, trading, DeFi, AI infra.',
    },
    {
      label: 'Betting on',
      text: 'Blockchain ending up inside mainstream finance. I want to be building the rails when it does.',
    },
    {
      label: 'Strength',
      text: 'Keeping money systems correct: idempotent payouts · consistent concurrent writes · event-driven settlement · on-chain and off-chain state in sync.',
    },
    { label: 'Open to', text: 'Relocation · remote' },
    { label: 'Off hours', text: "Sports, astronomy, a bit of astrology. Where the body can't go, the mind won't either." },
  ],
  ctaHire: 'Hire me',
  ctaCopy: 'copy email',
} as const;

// The home page around the identity card and the assistant.
export const HOME = {
  thatsMe: "that's me!",
  polaroidCaption: 'Nolan Tang',
  workTitle: "Things I've",
  workAccent: 'built',
  readCase: 'Read the case →',
  askAbout: '✎ ask about it',
  notesTitle: 'Notes from',
  notesAccent: 'building things.',
  allPosts: 'all posts →',
  stamps: { live: 'LIVE', open: 'open source', capstone: 'capstone' },
  theme: { toDark: 'Switch to dark theme', toLight: 'Switch to light theme' },
  bye: 'Thanks for stopping by.',
  byeLead: 'Email is the fastest way:',
} as const;

// Words written inside each project's little drawing on its card.
export const ART = {
  platter: {
    swap: 'Swap', sell: 'sell', sellAmount: '1,000', sellToken: 'USDe', buy: 'buy', buyAmount: '≈ 990.9',
    vault: 'steakUSDG', buyApy: 'APY 3.62%', gasless: 'gasless', sign: 'Sign', note: 'you sign · no gas',
    protocol: 'Morpho', apy: '3.62%', apyLabel: 'APY',
    cells: [['TVL', '$510.1M'], ['7d APY', '3.91%'], ['Withdraw now', '$39.6M'], ['Share price', '1.0082']],
    order: 'order', offChain: 'off-chain', clock: '4 s', auction: 'auction',
    bids: [['platter', '990.9'], ['solver', '990.7'], ['solver', '990.4'], ['solver', '990.6']], wins: '✓ wins',
    chain: 'Robinhood', tx: '1 tx ✓', floor: '≥ signed min',
  },
  platterSettle: {
    lanes: [['Wallet', 'holds USDe'], ['VaultRelayer', 'only puller'], ['GPv2Settlement', 'checks the limit'], ['Executor', 'forked 0x Settler'], ['Pool + vault', 'swap, then deposit']],
    steps: {
      approve: '① approve', pull: '② pull USDe', into: 'into settlement', send: '③ transfer, no approval', swap: '④ swap + deposit',
      back: 'steakUSDG back', fees: '⑤ lane fee + clearing', surplus: '⑥ surplus → user', pay: '⑦ pay at clearing price',
    },
    keep: ['Settlement keeps', 'protocol fee + lane fee'],
    legend: ['USDe, sold', 'steakUSDG, bought', 'approval only'],
  },
  platterArch: {
    zones: ['Browser', 'AWS EC2 · Singapore', 'Outside'],
    web: ['Platter web app', 'Next.js 16, wagmi, viem'], wallet: ['Wallet', 'signs orders and txs'],
    edge: ['Cloudflare → Caddy', 'TLS · /v1 to the API, the rest to web'], site: ['web', 'Next.js'],
    db: ['PostgreSQL 18', 'ledger, positions,', 'orders, vaults'],
    api: 'api · Hono on Node',
    apiJobs: ['quotes and routing', 'gasless orders and tracking', 'chain sync, reorg-safe ledger', 'per-trade reconciliation', 'vault discovery and APY'],
    cow: 'CoW stack · Docker Compose · Postgres 16', cowParts: ['orderbook', 'autopilot', 'driver · KMS', 'our solver'],
    chain: ['Robinhood Chain', 'DEXes and vaults'], contracts: ['Platter contracts', 'settlement, executor'],
    aggs: ['Aggregators', 'LI.FI, Relay, Uniswap, Across'], data: ['Data', 'DefiLlama · Chainlink'],
    legend: ['live', 'verified on a Robinhood mainnet fork'],
  },
  loop: { router: 'router', steps: ['spec', 'make', 'review', 'fix'], note: ['checks', 'only here'], human: 'human signs off' },
  guide: { note: 'answers from the site only' },
  live: { from: 'EN', to: '中', note: 'original audio never off' },
  amm: { formula: 'x · y = k', note: 'or revert', x: 'x', y: 'y' },
} as const;

// Chrome for the /blog screens. Posts themselves are Markdown files in src/content/blog/.
export const BLOG = {
  navLabel: 'Blog',
  eyebrow: 'Blog',
  title: 'Notes from building things.',
  // The trailing part of the title rendered with the blue→cyan gradient.
  titleAccent: 'building things.',
  lede: 'Short write-ups on fintech, agents and the unglamorous work of keeping state correct.',
  searchLabel: 'Search posts',
  allTag: 'All',
  postOne: 'post',
  postMany: 'posts',
  of: 'of',
  emptyTitle: 'Nothing matches',
  emptyHint: 'Try another tag or a shorter search.',
  noPostsTitle: 'No posts yet',
  noPostsHint: 'The first Markdown file dropped into the blog folder becomes the first post.',
  minShort: 'min',
  minRead: 'min read',
  backToAll: '← All posts',
  older: '← Older',
  newer: 'Newer →',
  adjacent: 'Adjacent posts',
} as const;
