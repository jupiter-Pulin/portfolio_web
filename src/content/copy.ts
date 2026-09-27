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
  privateRepo: 'Private repository',
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
  privateNotes: 'Design notes written for this page — the repository and its README stay private.',
  demoLabel: 'walkthrough video',
  explainerFile: 'The project, explained',
  explainerLabel: 'explainer video',
  architecture: 'Architecture',
  openFullSize: 'Open full size ↗',
} as const;

// The identity card on the home page, in Nolan's words: what he is after, what he
// is betting on, what he is strongest at. The assistant is given these too (prompt.ts).
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
  stamps: { live: 'LIVE', private: 'private repo', open: 'open source', capstone: 'capstone' },
  theme: { toDark: 'Switch to dark theme', toLight: 'Switch to light theme' },
  bye: 'Thanks for stopping by.',
  byeLead: 'Email is the fastest way:',
} as const;

// Words written inside each project's little drawing on its card.
export const ART = {
  platter: { chains: ['Eth', 'Base', 'RH'], api: 'API builds the tx', unsigned: '(unsigned)', sign: 'you sign', note: ['no keys on', 'the server!'] },
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
