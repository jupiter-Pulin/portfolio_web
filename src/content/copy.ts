// Page copy.
export const SITE = {
  name: 'Pulin Tang',
  wordmark: 'Pulin',
  title: 'Pulin Tang',
  location: 'Shenzhen, China · UTC+8 · Open to relocation and to remote',
  askLabel: 'Any question?',
  workTitle: 'Selected Work',
  workSubtitle: 'Four systems, one recurring problem: keeping state correct when the environment is not reliable.',
  stripTitle: 'Selected work',
  stripOpenAll: 'open all →',
  footNote: "Project images are placeholders · Figures marked self-reported come from Pulin's own run ledger.",
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
} as const;

export const HERO = {
  badge: 'Building at the intersection of fintech × AI',
  headline: 'I build products that turn complex systems into simple experiences.',
  // The trailing part of the headline rendered with the blue→cyan gradient.
  headlineAccent: 'simple experiences.',
  lede: "I'm Pulin, a product-minded software engineer with experience in fintech, blockchain and AI. I enjoy taking ideas from 0 to 1 — from product design and system architecture to development, deployment and real users.",
  ctaWork: 'View My Work',
  ctaHire: 'Hire Me',
  ctaCopy: 'copy email',
  tiltHint: 'move the mouse to tilt · click to pin',
  tiltPinned: 'pinned · click to release',
} as const;

export const HOW_I_BUILD = {
  flow: 'Ideas → Code → Users',
  live: 'Live',
  title: 'How I Build',
  subtitle: 'From idea to real-world products, end to end.',
  activeStep: 3,
  steps: [
    { n: 1, name: 'Idea', desc: 'Find real problems and define scope', icon: 'bulb' },
    { n: 2, name: 'Design', desc: 'Turn ideas into product plans', icon: 'file' },
    { n: 3, name: 'Build', desc: 'Frontend, backend, AI and infrastructure', icon: 'code' },
    { n: 4, name: 'Deploy', desc: 'Ship to production with reliability', icon: 'rocket' },
    { n: 5, name: 'Iterate', desc: 'Learn from users and keep improving', icon: 'chart' },
  ],
  terminal: {
    prompt: '> building...',
    lines: ['Product architecture', 'Backend services', 'AI agent workflows', 'Frontend experience', 'Production infrastructure'],
    shipping: 'Shipping...',
  },
  ship: {
    title: 'Ship useful products.',
    text: 'Build things that people actually use, and make a positive impact.',
    stats: [
      { v: '0 → 1', l: 'Product Experience' },
      { v: 'Real Users', l: 'Production Systems' },
      { v: 'Keep Learning', l: 'Always improving' },
    ],
  },
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
