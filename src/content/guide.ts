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
  placeholder: "Ask about the work, the stack, or how to reach Pulin",
  inputLabel: "Your question",
  send: "Send",
  typing: "guide is typing…",
  greeting:
    "I'm Pulin's site guide. Tell me what you're hiring for or what you want to see, and I'll take you there.",
  greetingFine:
    "Answers are written by an AI model from this site's own content, in the language you ask in. It can get things wrong — the case pages are the source. It never sends anything on Pulin's behalf.",
  // "Scoped to <name>. Pick a question…" — split so the name renders bold.
  scopedLead: "Scoped to ",
  scopedTail: ". Pick a question below or type your own.",
  reportLabel: "Report",
  mail: "Email Pulin",
  copy: "Copy email",
  allQuestions: "← All questions",
  pick: "Which project? Pick one and I'll answer for it.",
  all: "Back to the whole site. What are you looking for?",
  fallback:
    "That isn't something this site covers yet — try a chip, or name a project.",
  readFullCase: "Read the full case",
  // The location line is the same fact the footer states; it stays in one place.
  location: SITE.location,

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
        // The four figures are Loop Conductor's own stats; "self-reported" is their provenance.
        text: "one model call decides only which action; everything with a side effect is deterministic Node. 17 tasks run, 10 merged, $248.67 total spend (self-reported).",
      },
      {
        id: "live",
        text: "real-time two-way meeting interpretation; the original audio is never switched off, so no failure produces silence.",
      },
      {
        lead: "This guide",
        text: "a model answers from the site's own content in the visitor's language, says so when the site doesn't cover something, and never acts on Pulin's behalf.",
      },
    ],
  },

  code: {
    all: "All public code lives under one GitHub account.",
    private: "private · team-built",
    // Derived from links.ts so the label can never drift from the URL it opens.
    home: GITHUB.replace(/^https?:\/\//, ""),
  },

  contact: {
    intro: "Email is the fastest route; the subject line is pre-filled.",
    email: "Email",
    // Handles read off the links.ts URLs; X has no public handle yet, so the row
    // shows the address links.ts holds.
    rows: [
      { label: "LinkedIn", href: LINKEDIN, text: "pulin-tang" },
      { label: "GitHub", href: GITHUB, text: "jupiter-Pulin" },
      { label: "X", href: X, text: X.replace(/^https?:\/\//, "") },
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
  unavailable: { zh: "问答暂时关闭。", en: "The guide is switched off for now." },
  entries: {
    zh: { lead: "你可以先看看这些：", blog: "博客 · 即将上线", linkedin: "领英", x: "推特", work: "项目简介" },
    en: { lead: "In the meantime:", blog: "Blog · coming soon", linkedin: "LinkedIn", x: "X", work: "Projects" },
  },
  // The input's maxLength and the server's default question limit read the same number.
  limits: { maxQuestionChars: 100 },

  chips: {
    global: [
      { key: "payments", label: "I'm hiring for a payments / fintech backend role" },
      { key: "agents", label: "Show me the AI agent work" },
      { key: "code", label: "Where's the code?" },
      { key: "looking", label: "What is Pulin looking for?" },
      { key: "contact", label: "How do I reach him?" },
    ] as Chip[],
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
  { key: "code", label: "Where is the code?" },
  { key: "all", label: GUIDE.allQuestions },
];

export const openLabel = (name: string) => `Open ${name} ↗`;
export const linkLabel = (label: string) => `${label} ↗`;
export const scopedHeading = (name: string, key: keyof typeof GUIDE.heads) =>
  `${name} · ${GUIDE.heads[key]}`;
export const codeIntro = (name: string | null) =>
  name ? `Source for ${name}:` : GUIDE.code.all;
