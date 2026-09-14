// The posts are Markdown files on disk, one per post, photos in a folder beside
// them (contract in CONTENT.md). Server-only: node:fs at build time, never in a
// client component. The pure pieces are in blogText.ts.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Marked, type Tokens } from "marked";
import {
  escapeHtml,
  formatDate,
  parseFrontmatter,
  readingMinutes,
  resolveAsset,
  type Frontmatter,
} from "./blogText.ts";

export const POSTS_DIR = ["src", "content", "blog"] as const;
export const PHOTOS_DIR = ["public", "blog"] as const;
/** Checked in order when the header names no cover; the first file that exists wins. */
export const COVER_EXTENSIONS = ["webp", "png", "jpg", "jpeg", "svg"] as const;
/** `YYYY-MM-DD-<slug>.md`. The date orders the list, the slug is the URL. */
export const POST_FILE = /^(\d{4}-\d{2}-\d{2})-([a-z0-9][a-z0-9-]*)\.md$/;

export type PostMeta = {
  slug: string;
  file: string;
  date: string;
  dateShort: string;
  dateLong: string;
  title: string;
  summary: string;
  tags: string[];
  cover: string | null;
  coverCaption: string | null;
  draft: boolean;
  minutes: number;
};
export type Post = PostMeta & { body: string; html: string };
type Opts = { root?: string };

const str = (v: Frontmatter[string] | undefined): string | null =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;

const list = (v: Frontmatter[string] | undefined): string[] => {
  const raw = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  return [...new Set(raw.map((s) => s.trim()).filter(Boolean))];
};

function resolveCover(slug: string, meta: Frontmatter, root: string): string | null {
  const named = str(meta.cover);
  if (named) return resolveAsset(named, slug);
  for (const ext of COVER_EXTENSIONS) {
    if (existsSync(join(root, ...PHOTOS_DIR, slug, `cover.${ext}`))) return `/blog/${slug}/cover.${ext}`;
  }
  return null;
}

function readPost(file: string, root: string): { meta: PostMeta; body: string } {
  const m = file.match(POST_FILE);
  if (!m) throw new Error(`Not a post file name: ${file}`);
  const { meta, body } = parseFrontmatter(readFileSync(join(root, ...POSTS_DIR, file), "utf8"));
  const slug = str(meta.slug) ?? m[2];
  const date = str(meta.date) ?? m[1];
  return {
    meta: {
      slug,
      file,
      date,
      dateShort: formatDate(date, "short"),
      dateLong: formatDate(date, "long"),
      title: str(meta.title) ?? slug.replace(/-/g, " "),
      summary: str(meta.summary) ?? "",
      tags: list(meta.tags),
      cover: resolveCover(slug, meta, root),
      coverCaption: str(meta.coverCaption),
      draft: meta.draft === true,
      minutes: readingMinutes(body),
    },
    body,
  };
}

/** Published posts newest first, each with its raw body. Drafts are dropped here. */
function readAll(root: string): { meta: PostMeta; body: string }[] {
  const dir = join(root, ...POSTS_DIR);
  if (!existsSync(dir)) return [];
  const posts = readdirSync(dir)
    .filter((f) => POST_FILE.test(f))
    .sort()
    .map((f) => readPost(f, root));
  const seen = new Map<string, string>();
  for (const { meta } of posts) {
    const other = seen.get(meta.slug);
    if (other) throw new Error(`Duplicate blog slug "${meta.slug}": ${other} and ${meta.file}`);
    seen.set(meta.slug, meta.file);
  }
  return posts
    .filter((p) => !p.meta.draft)
    .sort((a, b) =>
      a.meta.date === b.meta.date
        ? b.meta.file.localeCompare(a.meta.file)
        : b.meta.date.localeCompare(a.meta.date),
    );
}

/** Every published post, newest first, without bodies. */
export function listPosts({ root = process.cwd() }: Opts = {}): PostMeta[] {
  return readAll(root).map((p) => p.meta);
}

/** One published post with its body rendered, or null (unknown slug, or a draft). */
export function getPost(slug: string, { root = process.cwd() }: Opts = {}): Post | null {
  const post = readAll(root).find((p) => p.meta.slug === slug);
  return post ? { ...post.meta, body: post.body, html: renderMarkdown(post.body, post.meta.slug) } : null;
}

/** Neighbours in list order: `newer` is the entry before, `older` the entry after. */
export function adjacentPosts(slug: string, posts: PostMeta[]): { newer: PostMeta | null; older: PostMeta | null } {
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return { newer: null, older: null };
  return { newer: posts[i - 1] ?? null, older: posts[i + 1] ?? null };
}

const isBlank = (t: { type: string; raw?: string }) =>
  t.type === "br" || t.type === "space" || (t.type === "text" && !(t.raw ?? "").trim());

function imageTag(img: Tokens.Image, slug: string, withTitle: boolean): string {
  const title = withTitle && img.title ? ` title="${escapeHtml(img.title)}"` : "";
  return `<img src="${escapeHtml(resolveAsset(img.href, slug))}" alt="${escapeHtml(img.text)}"${title} loading="lazy">`;
}

/**
 * Markdown → HTML (GFM via marked). Two house rules on top: a bare file name
 * points into public/blog/<slug>/, and a paragraph that holds nothing but images
 * becomes a captioned <figure> (one image) or a `gallery` grid (two or more).
 */
export function renderMarkdown(body: string, slug: string): string {
  const md = new Marked({ gfm: true });
  md.use({
    renderer: {
      image(img) {
        return imageTag(img, slug, true);
      },
      paragraph({ tokens }) {
        const images = tokens.filter((t): t is Tokens.Image => t.type === "image");
        if (images.length === 0 || !tokens.every((t) => t.type === "image" || isBlank(t))) {
          return `<p>${this.parser.parseInline(tokens)}</p>\n`;
        }
        if (images.length === 1) {
          const caption = images[0].title ? `<figcaption>${escapeHtml(images[0].title)}</figcaption>` : "";
          return `<figure>${imageTag(images[0], slug, false)}${caption}</figure>\n`;
        }
        const cols = images.length === 3 ? " cols-3" : "";
        return `<div class="gallery${cols}">${images.map((i) => imageTag(i, slug, true)).join("")}</div>\n`;
      },
    },
  });
  return md.parse(body) as string;
}
