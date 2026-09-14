// Every scripted answer the ask drawer can give, as data. The drawer renders
// these blocks; it decides nothing about what they say. Keeping the script pure
// is what lets the whole transcript be asserted without a browser.
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
import { EMAIL, GITHUB, MAILTO } from "../content/links.ts";
import { LOOKING, PROJECTS, projectById, type Project } from "../content/projects.ts";

/** Pause the guide takes before answering, in ms — the mock's 420. */
export const TYPING_MS = 420;

/** Reduced motion answers immediately — there is no "guide is typing…" state. */
export const typingPlaceholder = (reduced: boolean): string | null =>
  reduced ? null : GUIDE.typing;

/** A stretch of one paragraph. Text runs may carry <em> / <code> and nothing else. */
export type Run =
  | { t: "text"; v: string }
  | { t: "b"; v: string }
  | { t: "fine"; v: string }
  | { t: "br" };

/** The four things a chip in the transcript can do — all of them local. */
export type Action =
  | { t: "open"; id: string; label: string }
  | { t: "mail"; href: string; label: string; amber?: true }
  | { t: "copy"; label: string }
  | { t: "link"; href: string; label: string; amber?: true };

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

/** `<b>Lead</b> — text`, the shape of every report line in the mock. */
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
