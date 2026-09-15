// Free-text routing for the ask drawer, as a pure function.
// A project name wins over every keyword: naming one sets the scope and answers
// with that project's overview. Nothing here touches the DOM or the network.
import { GUIDE, scopedChips, type AnswerKey, type Chip } from "../content/guide.ts";

/** A typed question resolves to one scripted answer, and possibly a new scope. */
export type Route = { key: AnswerKey; scopeId: string | null; scopeChanged: boolean };

/** Project id ↔ the words a visitor uses for it. */
const NAMED: [string, RegExp][] = [
  ["loop", /loop|conductor/],
  ["live", /interpret|meeting|zoom|translat/],
  ["amm", /amm|dex|swap|uniswap|solidity/],
];

/** Keyword table — the first match wins. */
const KEYWORDS: [AnswerKey, RegExp][] = [
  ["payments", /(payment|fintech|settle|ledger|bank|money|trading|finance)/],
  ["agents", /(agent|llm|\bai\b|model|claude|automation|pipeline)/],
  ["code", /(code|github|repo|source)/],
  ["contact", /(contact|email|reach|hire|call|linkedin|talk)/],
  ["looking", /(looking|want|role|open to|relocat|remote|salary|visa)/],
  ["decision", /(decision|hardest|why|trade-?off)/],
  ["stack", /(stack|built with|tech|language|framework)/],
  ["status", /(production|status|live|users|shipped|running)/],
];

export function route(text: string, scopeId: string | null = null): Route {
  const t = text.toLowerCase();
  const named = NAMED.find(([, re]) => re.test(t));
  // Naming the project already in scope answers the overview again without
  // re-announcing the scope — the drawer only says "Scoped to …" on a change.
  if (named) return { key: "overview", scopeId: named[0], scopeChanged: named[0] !== scopeId };
  const hit = KEYWORDS.find(([, re]) => re.test(t));
  return { key: hit ? hit[0] : "fallback", scopeId, scopeChanged: false };
}

/** The question chips under the transcript: five global, or four plus a way back. */
export const chipsFor = (scopeName: string | null): Chip[] =>
  scopeName ? scopedChips(scopeName) : GUIDE.chips.global;

/** What the transcript echoes when a chip is clicked — the arrow is not part of it. */
export const echoLabel = (label: string) => label.replace(/^← /, "");
