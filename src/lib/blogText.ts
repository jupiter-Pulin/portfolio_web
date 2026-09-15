// Pure helpers behind the /blog screens — no node:fs, no Markdown parser — so the
// client-side list can import them too. Loading and rendering live in blog.ts.

export type Frontmatter = Record<string, string | string[] | boolean>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** `YYYY-MM-DD` → "Aug 12" (short) or "August 12, 2026" (long). No Intl, so the
    server and the browser always agree on the string. Anything else is returned as is. */
export function formatDate(iso: string, style: "short" | "long"): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return iso;
  return style === "short" ? `${month.slice(0, 3)} ${m[3]}` : `${month} ${Number(m[3])}, ${m[1]}`;
}

const unquote = (s: string) => s.trim().replace(/^(['"])(.*)\1$/, "$2");
/** YAML rule: ` #` starts a comment, except inside a quoted value. */
const stripComment = (s: string) => {
  const v = s.trim();
  const q = v[0];
  if (q === '"' || q === "'") {
    const end = v.indexOf(q, 1);
    if (end > 0) return v.slice(0, end + 1);
  }
  return v.replace(/(^|\s)#.*$/, "").trim();
};

/**
 * The header between the two `---` lines. Deliberately small YAML: `key: value`,
 * `key: [a, b]`, a block list (`- item` lines under a bare `key:`), quoted values,
 * and `true` / `false`. Everything after the header is the body, untouched.
 */
export function parseFrontmatter(text: string): { meta: Frontmatter; body: string } {
  const src = text.replace(/^﻿/, "");
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!m) return { meta: {}, body: src };
  const meta: Frontmatter = {};
  let listKey: string | null = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && listKey) {
      (meta[listKey] as string[]).push(unquote(stripComment(item[1])));
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const value = stripComment(kv[2]);
    listKey = null;
    if (value === "") {
      meta[key] = [];
      listKey = key;
    } else if (/^\[.*\]$/.test(value)) {
      meta[key] = value.slice(1, -1).split(",").map(unquote).filter(Boolean);
    } else if (value === "true" || value === "false") {
      meta[key] = value === "true";
    } else {
      meta[key] = unquote(value);
    }
  }
  return { meta, body: m[2] };
}

/** Latin words at 220 per minute plus CJK characters at 400 per minute, never below 1. */
export function readingMinutes(body: string): number {
  const text = body.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  const latin = (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []).length;
  const cjk = (text.match(/[㐀-䶿一-鿿぀-ヿ가-힯]/g) ?? []).length;
  return Math.max(1, Math.round(latin / 220 + cjk / 400));
}

/** A bare file name in a post refers to public/blog/<slug>/; URLs and root paths stay as written. */
export function resolveAsset(src: string, slug: string): string {
  const s = src.trim();
  if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(s)) return s;
  return `/blog/${slug}/${s.replace(/^\.\//, "")}`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type PostLike = { title: string; summary: string; tags: string[]; date: string };

/** The list's search box and tag chips, as one pure step. */
export function filterPosts<T extends PostLike>(posts: T[], { q, tag }: { q: string; tag: string | null }): T[] {
  const needle = q.trim().toLowerCase();
  return posts.filter(
    (p) =>
      (!tag || p.tags.includes(tag)) &&
      (!needle || `${p.title} ${p.summary} ${p.tags.join(" ")}`.toLowerCase().includes(needle)),
  );
}

/** Year → posts, in the order the posts arrive (newest first). */
export function groupByYear<T extends PostLike>(posts: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const p of posts) {
    const year = p.date.slice(0, 4);
    const list = map.get(year);
    if (list) list.push(p);
    else map.set(year, [p]);
  }
  return [...map];
}

export function allTags(posts: PostLike[]): string[] {
  return [...new Set(posts.flatMap((p) => p.tags))].sort();
}
