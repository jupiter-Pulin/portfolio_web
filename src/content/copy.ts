// Page copy.
export const SITE = {
  name: 'Nolan Tang',
  wordmark: 'Nolan',
  title: 'Nolan Tang',
  location: 'Shenzhen, China · UTC+8 · Open to relocation and to remote',
  description:
    'Nolan Tang, a product-minded software engineer with experience in fintech, blockchain and AI. Ask the site guide about the work, the stack, or how to reach him.',
  askLabel: 'Any question?',
  workTitle: 'Selected Work',
  workSubtitle: 'Four systems, one recurring problem: keeping state correct when the environment is not reliable.',
  stripTitle: 'Selected work',
  stripOpenAll: 'open all →',
  footNote: "Project images are placeholders · Figures marked self-reported come from Nolan's own run ledger.",
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
  demoLabel: 'walkthrough video',
  architecture: 'Architecture',
  openFullSize: 'Open full size ↗',
} as const;

// The identity card on the home page: short forms of what LOOKING and
// SITE.location already say, plus the avatar's alt text.
export const IDENTITY = {
  eyebrow: 'Nolan Tang · identity',
  status: 'Open to work',
  role: 'Product-minded software engineer · fintech × AI',
  avatarAlt: 'Nolan, drawn as a small horned creature resting its chin on its hands',
  facts: [
    { label: 'Based', text: 'Shenzhen, China · UTC+8' },
    {
      label: 'Looking for',
      text: 'Backend or full-stack work where being wrong has a cost: payments & settlement, trading, AI infrastructure',
    },
    {
      label: 'Experience',
      text: 'TypeScript · Node day to day · a year of production work in a team · four systems taken end to end solo',
    },
    { label: 'Open to', text: 'Relocation · remote' },
  ],
  ctaHire: 'Hire me',
  ctaCopy: 'copy email',
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
