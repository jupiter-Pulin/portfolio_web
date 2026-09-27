// Ask-drawer copy.
// The drawer asks a paid model through /api/ask; the model writes the answer text
// from this site's content, and everything clickable is built from here. It never
// sends anything on Pulin's behalf. Every string a visitor can read lives here —
// components hold none.
// Figures quoted in prose are the ones projects.ts already carries, with their
// provenance word kept ("self-reported"); nothing here invents a number.
import { SITE } from "./copy.ts";
import { GITHUB, LINKEDIN, X } from "./links.ts";
import { PROJECTS } from "./projects.ts";

/** The kinds of answer the guide gives. Every answer routes to one of these. */
export type AnswerKey =
  | "payments"
  | "agents"
  | "work"
  | "code"
  | "looking"
  | "contact"
  | "decision"
  | "stack"
  | "status"
  | "overview"
  | "all"
  | "fallback";

export type Chip = { key: AnswerKey; label: string };

export const GUIDE = {
  pill: "AI · answers from site content",
  placeholder: "Ask about the work, the stack, or how to reach Nolan",
  // The composer's placeholder types these in turn while it waits.
  examples: [
    "e.g. Is he a fit for a payments backend role?",
    "e.g. What's the hardest decision in Platter?",
    "e.g. Does he work with AI agents?",
    "e.g. Is he open to remote work?",
  ],
  inputLabel: "Your question",
  send: "Send",
  typing: "assistant is typing…",
  greeting:
    "I'm Nolan's assistant. Tell me what you're hiring for or what you want to see, and I'll take you there.",
  greetingFine:
    "I answer from Nolan's own site, in the language you ask in, and I can get things wrong — the case pages are the source. I never send anything on his behalf.",
  // "Scoped to <name>. Pick a question…" — split so the name renders bold.
  scopedLead: "Scoped to ",
  scopedTail: ". Pick a question below or type your own.",
  reportLabel: "Report",
  mail: "Email Nolan",
  copy: "Copy email",
  allQuestions: "← All questions",
  pick: "Which project? Pick one and I'll answer for it.",
  all: "Back to the whole site. What are you looking for?",
  fallback:
    "That isn't something this site covers yet — try a chip, or name a project.",
  readFullCase: "Read the full case",
  // The location line is the same fact the footer states; it stays in one place.
  location: SITE.location,

  // The home page: the assistant walks in and says hello; the chat opens only when asked.
  hero: {
    who: "Nolan's assistant",
    online: "Online",
    off: "Switched off",
    welcome: { hi: "Hi! Welcome to Nolan's site.", q: "Got a question about him? Just ask me.", cta: "Ask me →" },
    back: { hi: "I'll be right here.", q: "Anything else, just click me.", cta: "Back to the chat →" },
    stageCaption: "Nolan's assistant · AI · answers from his own site",
    robotLabel: "Nolan's assistant, drawn as a small robot. Click to chat.",
    greetLead: "Hi! I'm Nolan's assistant. Tell me what you're hiring for, or what you want to see —",
    greetAccent: "I'll take you there.",
    hideChat: "hide chat ↘",
    scopedLabel: "About",
    showMe: "show me ↓",
    here: "here!",
  },

  // "Under the hood": what the server did for one answer, shown beneath it.
  hud: {
    toggle: "under the hood",
    route: "route",
    retrieval: "retrieval",
    retrievalNote: (k: number) => `local hash index · top-${k}`,
    model: "model",
    tokens: (input: number, output: number) =>
      `${input.toLocaleString("en-US")} in / ${output.toLocaleString("en-US")} out tokens`,
    language: "language",
    languageFrom: "sample from your last typed question:",
    languageNone: "this question",
    note: "No embedding API, no vector database: chunks are hashed locally, the model routes and writes the answer in one call.",
  },

  fit: {
    intro: "Two places to look, in order.",
    title: "Fit · payments / fintech backend",
    items: [
      {
        id: "amm",
        text: "the pair re-derives every amount from its own balances and reverts on the invariant. Correctness lives where the money is.",
      },
      {
        id: "loop",
        text: "process evidence: review approval is bound to a commit hash and re-checked at the merge gate.",
      },
    ],
    note: "Scope note: both are solo builds. Day job: a year of production backend work in a team, TypeScript / Node.",
  },

  agents: {
    intro: "Two shipped systems and one you are talking to.",
    title: "AI agent work",
    items: [
      {
        id: "loop",
        text: "an agent-led workflow: a router agent picks each next step with real autonomy, the harness only runs the checks that can’t be left to an agent, and a human signs off before anything merges.",
      },
      {
        id: "live",
        text: "real-time two-way meeting interpretation; the original audio is never switched off, so no failure produces silence.",
      },
      {
        lead: "This guide",
        text: "a model answers from the site's own content in the visitor's language, says so when the site doesn't cover something, and never acts on Nolan's behalf.",
      },
    ],
  },

  // Sent with every question and indexed, like fit / agents, but with no answer card of
  // its own: an LP or DeFi question is answered from these lines and the passages.
  lp: {
    items: [
      {
        id: "platter",
        text: "multi-chain LP positions on Uniswap V3, Uniswap V4 and Aerodrome Slipstream, live at platterfi.trade: collectable fees from the fee-growth math, withdrawn principal settled before anything counts as fees, PnL against holding with impermanent loss and gas reported apart, ranges symmetric in tick space, and a chain sync that rolls back on a reorg.",
      },
      {
        lead: "Writing",
        text: "blog posts on why the price range matters more than APR for a concentrated-liquidity position, what an LP terminal should keep together, and how Uniswap DualPool lets LP inventory earn vault yield.",
      },
    ],
  },

  work: {
    intro: "Two to look at first; the rest are one click away.",
    all: "All work →",
  },

  code: {
    all: "All public code lives under one GitHub account.",
    private: "private repository",
    // Derived from links.ts so the label can never drift from the URL it opens.
    home: GITHUB.replace(/^https?:\/\//, ""),
  },

  contact: {
    intro: "Email is the fastest route; the subject line is pre-filled.",
    email: "Email",
    // Handles read off the links.ts URLs.
    rows: [
      { label: "LinkedIn", href: LINKEDIN, text: "nolan-tang" },
      { label: "GitHub", href: GITHUB, text: "jupiter-Pulin" },
      { label: "X", href: X, text: "will_pu7490" },
    ],
  },

  overview: {
    wrong: "What goes wrong unattended:",
    mechanism: "The mechanism:",
  },

  // Suffix of the heading above a quoted qa.* answer.
  heads: {
    decision: "one decision, in detail",
    stack: "stack",
    status: "status",
  },

  // Fixed copy shown when the model is not reached. `zh` is Pulin's own wording;
  // copyLang() in src/lib/askClient.ts picks the language.
  systemError: { zh: "系统出现了问题，请稍后重试。", en: "Something went wrong. Please try again later." },
  limited: { zh: "今日额度已用完", en: "Today's quota is used up." },
  unavailable: { zh: "问答暂时关闭。", en: "Nolan's assistant is off for now." },
  entries: {
    zh: { lead: "你可以先看看这些：", blog: "博客", linkedin: "领英", x: "推特", work: "项目简介" },
    en: { lead: "In the meantime:", blog: "Blog", linkedin: "LinkedIn", x: "X", work: "Projects" },
  },
  // The input's maxLength and the server's default question limit read the same number;
  // the daily quota the home page states is the server's default visitor limit.
  limits: { maxQuestionChars: 100, visitorDailyQuestions: 10 },

  // Three starters, one per visitor intent: fit, evidence, contact. Everything
  // else is offered as a follow-up under an answer, two at most.
  chips: {
    global: [
      { key: "looking", label: "Is he a fit for my role?" },
      { key: "work", label: "What has he built?" },
      { key: "contact", label: "How do I reach him?" },
    ] as Chip[],
  },
  follow: {
    payments: "Show me the fintech-relevant work",
    agents: "Show me the AI agent work",
    code: "Where's the code?",
  },
} as const;

/** Nudge after a question the site does not cover: every project name. */
export const fallbackFine = `Try a chip, or name a project: ${PROJECTS.map((p) => p.name).join(", ")}.`;

export const scopedNotice = (name: string) => `${GUIDE.scopedLead}${name}${GUIDE.scopedTail}`;

/** Chips offered once a project is in scope; the first one names it. */
export const scopedChips = (name: string): Chip[] => [
  { key: "decision", label: `Hardest decision in ${name}?` },
  { key: "stack", label: "What is the stack?" },
  { key: "status", label: "Is it in production?" },
  { key: "all", label: GUIDE.allQuestions },
];

const [FIT, WORK_CHIP, CONTACT] = GUIDE.chips.global;
const followChip = (key: keyof typeof GUIDE.follow): Chip => ({ key, label: GUIDE.follow[key] });

/**
 * At most two follow-ups under an answer, picked by what it was about. Inside a
 * project they are that project's other questions; elsewhere, the next thing a
 * visitor on that topic usually wants.
 */
export function followUps(key: AnswerKey, scopeName: string | null): Chip[] {
  if (scopeName && key !== "all") return scopedChips(scopeName).filter((c) => c.key !== key && c.key !== "all").slice(0, 2);
  switch (key) {
    case "looking":
      return [followChip("payments"), WORK_CHIP];
    case "work":
      return [followChip("agents"), followChip("code")];
    case "contact":
      return [FIT, WORK_CHIP];
    case "payments":
      return [CONTACT, followChip("code")];
    case "agents":
    case "code":
      return [WORK_CHIP, CONTACT];
    default:
      return [WORK_CHIP, CONTACT];
  }
}

export const openLabel = (name: string) => `Open ${name} ↗`;
export const linkLabel = (label: string) => `${label} ↗`;
export const scopedHeading = (name: string, key: keyof typeof GUIDE.heads) =>
  `${name} · ${GUIDE.heads[key]}`;
export const codeIntro = (name: string | null) =>
  name ? `Source for ${name}:` : GUIDE.code.all;
