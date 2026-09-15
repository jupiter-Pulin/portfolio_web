// The model's answer is plain text and stays plain text. What this module adds is
// recognition: the things in that text the site already knows — a project's name,
// a term from a project's stack, a public address from links.ts, a figure — become
// typed runs so the drawer can set them apart. Nothing is parsed as markup: an
// address the site does not list stays ordinary text, so the model cannot make a
// link clickable by writing one.
import { EMAIL, GITHUB, LINKEDIN, MAILTO, X } from "../content/links.ts";
import { PROJECTS, type Project } from "../content/projects.ts";
import type { Run } from "./guideAnswer.ts";

export type Lexicon = {
  /** Project names, longest first, matched without regard to case. */
  names: { id: string; name: string }[];
  /** Stack terms, longest first, matched exactly. */
  terms: string[];
  /** Public addresses the site lists (links.ts and the projects' repositories). */
  urls: Set<string>;
  email: string;
};

/** Up to this many words, and at least one capital or digit: a name, not a phrase. */
const TERM_WORDS = 3;

const byLength = (a: string, b: string) => b.length - a.length || (a < b ? -1 : a > b ? 1 : 0);

/** The stack field split on its separators, keeping the pieces that read as a name. */
export function stackTerms(stack: string): string[] {
  return stack
    .split(/\s*[·,—:()]\s*/)
    .map((s) => s.trim())
    .filter((s) => s !== "" && s.split(/\s+/).length <= TERM_WORDS && /[A-Z0-9]/.test(s));
}

const stripSlash = (url: string) => url.replace(/\/+$/, "");

export function buildLexicon(projects: readonly Project[] = PROJECTS): Lexicon {
  const names = [...projects].sort((a, b) => byLength(a.name, b.name)).map((p) => ({ id: p.id, name: p.name }));
  const termSet = new Set<string>();
  for (const p of projects) for (const t of stackTerms(p.stack)) termSet.add(t);
  for (const { name } of names) termSet.delete(name);
  const urls = new Set<string>([GITHUB, LINKEDIN, X].map(stripSlash));
  for (const p of projects) {
    if (p.private) continue;
    for (const r of p.repos) urls.add(stripSlash(r.url));
    if (p.readmeUrl) urls.add(stripSlash(p.readmeUrl));
  }
  return { names, terms: [...termSet].sort(byLength), urls, email: EMAIL };
}

const URL_RE = /https?:\/\/[^\s<>()]+/g;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
/** A figure: optional currency, digits with separators, optional % or unit suffix like 5-second. */
const NUM_RE = /[$€£¥]?\d[\d,.]*(?:-\d[\d,.]*)*(?:%|-[A-Za-z]+)?/g;
/** Punctuation an address may end a sentence with; it is not part of the address. */
const TRAIL = /[.,;:!?)\]，。；：！？）】]+$/;

const latin = (c: string | undefined) => c !== undefined && /[A-Za-z0-9]/.test(c);
/** A Latin word boundary on each side; CJK text around a term does not need a space. */
const wordBounded = (s: string, start: number, end: number) => !latin(s[start - 1]) && !latin(s[end]);

const text = (v: string): Run => ({ t: "text", v });

/** How a listed address reads in the bubble: no scheme, no www, no trailing slash. */
export const shortAddress = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");

type Span = { start: number; end: number; run: Run };

function findAddresses(s: string, lex: Lexicon): Span[] {
  const out: Span[] = [];
  for (const m of s.matchAll(URL_RE)) {
    const raw = m[0].replace(TRAIL, "");
    if (!lex.urls.has(stripSlash(raw))) continue;
    const start = m.index ?? 0;
    out.push({ start, end: start + raw.length, run: { t: "link", href: raw, v: raw } });
  }
  for (const m of s.matchAll(EMAIL_RE)) {
    if (m[0].toLowerCase() !== lex.email.toLowerCase()) continue;
    const start = m.index ?? 0;
    out.push({ start, end: start + m[0].length, run: { t: "link", href: MAILTO, v: m[0], mail: true } });
  }
  return out;
}

function findNames(s: string, lex: Lexicon): Span[] {
  const out: Span[] = [];
  const lower = s.toLowerCase();
  for (const { id, name } of lex.names) {
    const needle = name.toLowerCase();
    let at = 0;
    for (;;) {
      const start = lower.indexOf(needle, at);
      if (start === -1) break;
      const end = start + needle.length;
      if (wordBounded(s, start, end)) out.push({ start, end, run: { t: "ent", id, v: s.slice(start, end) } });
      at = end;
    }
  }
  return out;
}

function findTerms(s: string, lex: Lexicon): Span[] {
  const out: Span[] = [];
  for (const term of lex.terms) {
    let at = 0;
    for (;;) {
      const start = s.indexOf(term, at);
      if (start === -1) break;
      const end = start + term.length;
      if (wordBounded(s, start, end)) out.push({ start, end, run: { t: "tech", v: term } });
      at = end;
    }
  }
  return out;
}

function findNumbers(s: string): Span[] {
  const out: Span[] = [];
  for (const m of s.matchAll(NUM_RE)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    // Digits glued to letters ("MV3", "V2", "sha256") are part of a name, not a figure.
    if (latin(s[start - 1]) || (latin(s[end]) && !m[0].includes("-"))) continue;
    out.push({ start, end, run: { t: "num", v: m[0] } });
  }
  return out;
}

/** Earlier passes win; a later span that overlaps one already kept is dropped. */
function addSpans(kept: Span[], found: Span[]): void {
  for (const span of found) {
    if (kept.some((k) => span.start < k.end && k.start < span.end)) continue;
    kept.push(span);
  }
}

/** One line of the model's answer as runs: recognised things typed, everything else text. */
export function markupLine(line: string, lex: Lexicon = LEXICON): Run[] {
  const spans: Span[] = [];
  addSpans(spans, findAddresses(line, lex));
  addSpans(spans, findNames(line, lex));
  addSpans(spans, findTerms(line, lex));
  addSpans(spans, findNumbers(line));
  spans.sort((a, b) => a.start - b.start);
  const runs: Run[] = [];
  let at = 0;
  for (const span of spans) {
    if (span.start > at) runs.push(text(line.slice(at, span.start)));
    runs.push(span.run);
    at = span.end;
  }
  if (at < line.length) runs.push(text(line.slice(at)));
  return runs.length ? runs : [text(line)];
}

export const LEXICON: Lexicon = buildLexicon();
