// The qa.* strings in projects.ts carry two inline tags and no others (see the
// header of that file). Nothing here ever reaches dangerouslySetInnerHTML: the
// string is split into tokens, and React escapes every text token on its own —
// so a stray "<script>" or "&" in the content renders as the characters it is.
import { createElement, type ReactNode } from "react";

export const INLINE_TAGS = ["em", "code"] as const;
export type InlineTag = (typeof INLINE_TAGS)[number];
export type InlineToken = { tag: "text" | InlineTag; text: string };

const PAIR = new RegExp(`<(${INLINE_TAGS.join("|")})>([\\s\\S]*?)</\\1>`, "g");

/** Split a content string into plain text and the two tags that are allowed in it. */
export function tokenizeInline(source: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let at = 0;
  for (const m of source.matchAll(PAIR)) {
    const start = m.index ?? 0;
    if (start > at) tokens.push({ tag: "text", text: source.slice(at, start) });
    tokens.push({ tag: m[1] as InlineTag, text: m[2] });
    at = start + m[0].length;
  }
  if (at < source.length) tokens.push({ tag: "text", text: source.slice(at) });
  return tokens;
}

/** The same string as React nodes: <em> and <code> elements, everything else text. */
export function inlineNodes(source: string): ReactNode[] {
  return tokenizeInline(source).map((token, i) =>
    token.tag === "text" ? token.text : createElement(token.tag, { key: i }, token.text),
  );
}
