// The local retrieval index for /api/ask: content split into chunks, each with a
// feature-hashed vector. No embedding API and no vector store — the vectors are
// a pure function of the text, so scripts/build-ask-index.mjs is deterministic
// and the committed JSON can be regenerated and compared in a test.
import type { Project } from "../content/projects.ts";

export type Chunk = {
  id: string;
  projectId: string | null;
  field: string;
  text: string;
  vector: number[];
};

type GuideItem = { id?: string; lead?: string; text: string };
export type Corpus = {
  projects: readonly Project[];
  looking: string;
  guide: { fit: { items: readonly GuideItem[] }; agents: { items: readonly GuideItem[] } };
};

export const EMBED_DIM = 512;

/** Longest readme excerpt per chunk, in characters. */
const README_CHUNK = 480;

/** Drop the two inline tags the content may carry; their text stays. */
export const stripTags = (s: string): string => s.replace(/<\/?(em|code)>/g, "");

const URL_RE = /https?:\/\/\S+/g;

const PROJECT_FIELDS = [
  "short",
  "role",
  "stack",
  "tagline",
  "thesis",
  "wrong",
  "mechanism",
  "qa.decision",
  "qa.stack",
  "qa.status",
] as const;

const fieldValue = (p: Project, field: (typeof PROJECT_FIELDS)[number]): string =>
  field.startsWith("qa.") ? p.qa[field.slice(3) as keyof Project["qa"]] : (p[field as keyof Project] as string);

/** A readme cut at paragraph breaks into excerpts no longer than README_CHUNK. */
function readmeExcerpts(readme: string): string[] {
  const paras = readme
    .split(/\n\s*\n/)
    .map((s) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim())
    .filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const para of paras) {
    if (cur && cur.length + para.length + 1 > README_CHUNK) {
      out.push(cur);
      cur = "";
    }
    cur = cur ? `${cur}\n${para}` : para;
  }
  if (cur) out.push(cur);
  return out;
}

/** Every chunk the guide can retrieve, in a fixed order, each with its hashEmbed vector. */
export function chunkCorpus(corpus: Corpus): Chunk[] {
  const chunks: Chunk[] = [];
  const push = (projectId: string | null, field: string, n: number, raw: string, isPrivate = false) => {
    let text = stripTags(raw).trim();
    // A private project never contributes an address, whatever its text holds.
    if (isPrivate) text = text.replace(URL_RE, "").trim();
    if (!text) return;
    chunks.push({ id: `${projectId ?? "site"}:${field}:${n}`, projectId, field, text, vector: hashEmbed(text) });
  };

  for (const p of corpus.projects) {
    const priv = Boolean(p.private);
    const named = (s: string) => `${p.name}: ${s}`;
    for (const field of PROJECT_FIELDS) push(p.id, field, 0, named(fieldValue(p, field)), priv);
    if (p.readme) readmeExcerpts(p.readme).forEach((s, i) => push(p.id, "readme", i, named(s), priv));
    if (priv && p.scope) push(p.id, "scope", 0, named(p.scope), true);
  }
  push(null, "looking", 0, corpus.looking);
  corpus.guide.fit.items.forEach((item, i) => push(item.id ?? null, "fit", i, guideText(item)));
  corpus.guide.agents.items.forEach((item, i) => push(item.id ?? null, "agents", i, guideText(item)));
  return chunks;
}

const guideText = (item: GuideItem) => (item.lead ? `${item.lead}: ${item.text}` : item.text);

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const TOKEN_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+|[\p{L}\p{N}]+/gu;

/** Words and their trigrams for Latin-like scripts (plus a crude plural fold); characters and bigrams for CJK. */
function features(text: string): string[] {
  const out: string[] = [];
  for (const [run] of text.normalize("NFKC").toLowerCase().matchAll(TOKEN_RE)) {
    if (CJK.test(run[0])) {
      const chars = [...run];
      chars.forEach((c, i) => {
        out.push(`c:${c}`);
        if (i + 1 < chars.length) out.push(`b:${c}${chars[i + 1]}`);
      });
    } else {
      const word = run.length > 3 && run.endsWith("s") && !run.endsWith("ss") ? run.slice(0, -1) : run;
      out.push(`w:${word}`);
      // Character trigrams soften hash collisions on short texts and catch partial words.
      const padded = `^${word}$`;
      for (let i = 0; i + 3 <= padded.length; i++) out.push(`t:${padded.slice(i, i + 3)}`);
    }
  }
  if (out.length === 0) for (const c of text.trim()) out.push(`c:${c}`);
  return out;
}

/** 32-bit FNV-1a over the UTF-16 code units. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A deterministic, L2-normalised feature-hash vector. Empty text is the zero vector. */
export function hashEmbed(text: string): number[] {
  const v = new Array<number>(EMBED_DIM).fill(0);
  for (const f of features(text)) {
    const h = fnv1a(f);
    v[h % EMBED_DIM] += h & 0x80000000 ? -1 : 1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm === 0 ? v : v.map((x) => x / norm);
}

export function cosine(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return Math.max(-1, Math.min(1, dot / Math.sqrt(na * nb)));
}

/** The k best chunks by cosine, highest first; ties go to the smaller id. */
export function topK<T extends Pick<Chunk, "id" | "vector">>(
  index: readonly T[],
  vector: readonly number[],
  k: number,
): T[] {
  return index
    .map((chunk) => ({ chunk, score: cosine(chunk.vector, vector) }))
    .sort((x, y) => y.score - x.score || (x.chunk.id < y.chunk.id ? -1 : x.chunk.id > y.chunk.id ? 1 : 0))
    .slice(0, Math.max(0, k))
    .map((s) => s.chunk);
}
