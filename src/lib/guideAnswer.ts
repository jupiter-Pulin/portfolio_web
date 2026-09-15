// Every answer block the ask drawer renders, as data. The model writes the answer
// text; what is clickable next to it (and the fixed copy for when the model is not
// reached) is built here from content. Keeping this pure is what lets the whole
// transcript be asserted without a browser.
//
// Runtime imports carry the .ts extension so the plain `node --test` suite can
// load this module the same way the bundler does.
import {
  GUIDE,
  codeIntro,
  fallbackFine,
  linkLabel,
  openLabel,
  scopedHeading,
  type AnswerKey,
} from "../content/guide.ts";
import BLOG_POSTS from "../generated/ask-blog.json" with { type: "json" };
import { BLOG, EMAIL, GITHUB, LINKEDIN, MAILTO, X } from "../content/links.ts";
import { LOOKING, PROJECTS, projectById, type Project } from "../content/projects.ts";
import { markupLine } from "./answerMarkup.ts";
import type { AskBlogEntry } from "./askIndex.ts";

/** Pause the guide takes before answering, in ms. */
export const TYPING_MS = 420;

/** Reduced motion answers immediately — there is no "guide is typing…" state. */
export const typingPlaceholder = (reduced: boolean): string | null =>
  reduced ? null : GUIDE.typing;

/** A stretch of one paragraph. Text runs may carry <em> / <code> and nothing else;
    the last four are what answerMarkup.ts recognises in a model-written line. */
export type Run =
  | { t: "text"; v: string }
  | { t: "b"; v: string }
  | { t: "fine"; v: string }
  | { t: "br" }
  // A project the site has, by name: clicking opens it.
  | { t: "ent"; id: string; v: string }
  // A term from a project's stack field.
  | { t: "tech"; v: string }
  // A figure.
  | { t: "num"; v: string }
  // An address the site lists; `mail` marks the email.
  | { t: "link"; href: string; v: string; mail?: true };

/** What a chip in the transcript can do — all of them local. */
export type Action =
  | { t: "open"; id: string; label: string }
  | { t: "mail"; href: string; label: string; amber?: true }
  | { t: "copy"; label: string }
  | { t: "link"; href: string; label: string; amber?: true }
  // An in-site page, reached through the router.
  | { t: "nav"; href: string; label: string };

export type Row = { label: string; right: Action | { t: "muted"; text: string } };
export type ReportItem = { runs: Run[]; action?: Action };

export type Block =
  | { kind: "p"; runs: Run[]; fine?: true }
  | { kind: "report"; title: string; items: ReportItem[]; note?: string; actions: Action[] }
  | { kind: "rows"; rows: Row[] }
  | { kind: "actions"; actions: Action[] }
  | { kind: "picks"; then: AnswerKey };

const text = (v: string): Run => ({ t: "text", v });
const bold = (v: string): Run => ({ t: "b", v });
const fine = (v: string): Run => ({ t: "fine", v });
const para = (...runs: Run[]): Block => ({ kind: "p", runs });
const fineP = (v: string): Block => ({ kind: "p", runs: [text(v)], fine: true });
const actions = (...list: Action[]): Block => ({ kind: "actions", actions: list });

const name = (id: string) => projectById(id)?.name ?? id;
const open = (id: string, label?: string): Action => ({
  t: "open",
  id,
  label: label ?? openLabel(name(id)),
});
const mail = (label: string = GUIDE.mail): Action => ({
  t: "mail",
  href: MAILTO,
  label,
  amber: true,
});
const copy = (): Action => ({ t: "copy", label: GUIDE.copy });
const link = (href: string, label: string): Action => ({ t: "link", href, label: linkLabel(label) });

/** `<b>Lead</b> — text`, the shape of every report line. */
const lead = (leadText: string, body: string): Run[] => [bold(leadText), text(` — ${body}`)];

const reportItems = (items: readonly { id?: string; lead?: string; text: string }[]): ReportItem[] =>
  items.map((item) =>
    item.id
      ? { runs: lead(name(item.id), item.text), action: open(item.id) }
      : { runs: lead(item.lead ?? "", item.text) },
  );

/** The two-paragraph hello, pushed once per page load. */
export const greetingBlocks = (): Block[] => [
  para(text(GUIDE.greeting)),
  fineP(GUIDE.greetingFine),
];

/** "Scoped to <name>." — only ever shown when the scope actually changed. */
export const scopedBlocks = (scopeName: string): Block[] => [
  para(text(GUIDE.scopedLead), bold(scopeName), text(GUIDE.scopedTail)),
];

/**
 * The guide messages an open() adds: the greeting on the first open of the page,
 * then a scope line when this open put a different project in scope.
 */
export function openIntro(opts: {
  scopeId: string | null;
  previousScopeId: string | null;
  greeted: boolean;
}): Block[][] {
  const messages: Block[][] = [];
  if (!opts.greeted) messages.push(greetingBlocks());
  if (opts.scopeId && opts.scopeId !== opts.previousScopeId) {
    messages.push(scopedBlocks(name(opts.scopeId)));
  }
  return messages;
}

const codeRows = (scope: Project | null): Row[] =>
  (scope ? [scope] : PROJECTS).flatMap((p): Row[] =>
    p.private
      ? [{ label: p.name, right: { t: "muted", text: GUIDE.code.private } }]
      : p.repos.map((r) => ({ label: p.name, right: link(r.url, r.label) })),
  );

// The address itself is the label of the mailto chip in the contact answer.
const contactRows = (): Row[] => [
  { label: GUIDE.contact.email, right: mail(EMAIL) },
  ...GUIDE.contact.rows.map((r) => ({ label: r.label, right: link(r.href, r.text) })),
];

const qaBlocks = (key: "decision" | "stack" | "status", scope: Project): Block[] => [
  para(bold(scopedHeading(scope.name, key))),
  para(text(scope.qa[key])),
  ...(key === "decision" ? [actions(open(scope.id, GUIDE.readFullCase))] : []),
];

const pickBlocks = (then: AnswerKey): Block[] => [
  para(text(GUIDE.pick)),
  { kind: "picks", then },
];

const overviewBlocks = (scope: Project): Block[] => [
  para(bold(scope.name), text(` — ${scope.tagline}`)),
  para(
    fine(GUIDE.overview.wrong),
    text(` ${scope.wrong}`),
    { t: "br" },
    fine(GUIDE.overview.mechanism),
    text(` ${scope.mechanism}`),
  ),
  actions(open(scope.id)),
];

const fallbackBlocks = (): Block[] => [para(text(GUIDE.fallback)), fineP(fallbackFine)];

/** The scripted answer to one question, for the project in scope (or none). */
export function answerBlocks(key: AnswerKey, scopeId: string | null): Block[] {
  const scope = scopeId ? projectById(scopeId) ?? null : null;
  switch (key) {
    case "payments":
      return [
        para(text(GUIDE.fit.intro)),
        {
          kind: "report",
          title: GUIDE.fit.title,
          items: reportItems(GUIDE.fit.items),
          note: GUIDE.fit.note,
          actions: [mail(), copy()],
        },
      ];
    case "agents":
      return [
        para(text(GUIDE.agents.intro)),
        {
          kind: "report",
          title: GUIDE.agents.title,
          items: reportItems(GUIDE.agents.items),
          actions: [mail()],
        },
      ];
    case "code":
      return [
        para(text(codeIntro(scope?.name ?? null))),
        { kind: "rows", rows: codeRows(scope) },
        actions(link(GITHUB, GUIDE.code.home)),
      ];
    case "looking":
      return [para(text(LOOKING)), actions(mail(), copy())];
    case "contact":
      return [
        para(text(GUIDE.contact.intro)),
        { kind: "rows", rows: contactRows() },
        fineP(GUIDE.location),
        actions(copy()),
      ];
    case "decision":
    case "stack":
    case "status":
      return scope ? qaBlocks(key, scope) : pickBlocks(key);
    case "overview":
      // Only ever reached with a scope; without one there is nothing to survey.
      return scope ? overviewBlocks(scope) : fallbackBlocks();
    case "all":
      return [para(text(GUIDE.all))];
    default:
      return fallbackBlocks();
  }
}

/** The language of the fixed copy; see copyLang() in askClient.ts. */
export type CopyLang = "zh" | "en";

/**
 * Everything clickable in the scripted answer for (key, scope), in order and
 * without repeats, plus its project picker — and none of its text. This is what
 * sits under a model-written answer.
 */
export function answerActions(
  key: AnswerKey,
  scopeId: string | null,
  projects: readonly Project[] = PROJECTS,
): Block[] {
  // A private project has no repository to point at, not even the account home.
  if (key === "code" && projects.find((p) => p.id === scopeId)?.private) return [];
  const found: Action[] = [];
  const picks: Block[] = [];
  const seen = new Set<string>();
  const add = (a: Action) => {
    const id = JSON.stringify(a);
    if (seen.has(id)) return;
    seen.add(id);
    found.push(a);
  };
  for (const block of answerBlocks(key, scopeId)) {
    switch (block.kind) {
      case "report":
        block.items.forEach((item) => item.action && add(item.action));
        block.actions.forEach(add);
        break;
      case "rows":
        block.rows.forEach((row) => row.right.t !== "muted" && add(row.right));
        break;
      case "actions":
        block.actions.forEach(add);
        break;
      case "picks":
        picks.push(block);
        break;
    }
  }
  return [...(found.length ? [actions(...found)] : []), ...picks];
}

/** A chip for each listed post the answer links to, in order of first mention; unknown slugs are ignored. */
function postActions(answer: string, posts: readonly AskBlogEntry[]): Action[] {
  const found = new Map<string, Action>();
  for (const [, slug] of answer.matchAll(/\/blog\/([a-z0-9-]+)/g)) {
    const post = posts.find((p) => p.slug === slug);
    if (post && !found.has(slug)) found.set(slug, { t: "nav", href: `/blog/${slug}`, label: post.title });
  }
  return [...found.values()];
}

/**
 * The model's answer as paragraphs with the site's own things marked (answerMarkup.ts),
 * then the content-built actions. Posts the answer links to join the end of that
 * actions block, ahead of any picker.
 */
export const modelAnswerBlocks = (
  answer: string,
  key: AnswerKey,
  scopeId: string | null,
  posts: readonly AskBlogEntry[] = BLOG_POSTS,
): Block[] => {
  const onward = answerActions(key, scopeId);
  const links = postActions(answer, posts);
  if (links.length) {
    // answerActions puts its one actions block, if any, before the picks.
    const first = onward[0];
    if (first?.kind === "actions") onward[0] = actions(...first.actions, ...links);
    else onward.unshift(actions(...links));
  }
  return [
    ...answer
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => para(...markupLine(line))),
    ...onward,
  ];
};

/** Four ways onward when the guide cannot answer: the blog, LinkedIn, X, the projects. */
export const entryActions = (lang: CopyLang): Action[] => {
  const labels = GUIDE.entries[lang];
  return [
    { t: "nav", href: BLOG.href, label: labels.blog },
    { t: "link", href: LINKEDIN, label: labels.linkedin },
    { t: "link", href: X, label: labels.x },
    { t: "nav", href: "/work", label: labels.work },
  ];
};

const withEntries = (lead: string, lang: CopyLang): Block[] => [
  para(text(lead)),
  para(text(GUIDE.entries[lang].lead)),
  actions(...entryActions(lang)),
];

/** Visitor limit or budget reached. */
export const limitedBlocks = (lang: CopyLang): Block[] => withEntries(GUIDE.limited[lang], lang);
/** ASK_ENABLED=false. */
export const unavailableBlocks = (lang: CopyLang): Block[] => withEntries(GUIDE.unavailable[lang], lang);
/** Everything else: one line, nothing to click. */
export const errorBlocks = (lang: CopyLang): Block[] => [para(text(GUIDE.systemError[lang]))];
