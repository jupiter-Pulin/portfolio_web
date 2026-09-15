// The /api/ask wire contract, shared by the drawer and the route handler.
// Pure data and checks: nothing here reads env or touches the network, so the
// client bundle can import it without pulling a server secret along.
import type { AnswerKey } from "../content/guide.ts";
import { PROJECTS } from "../content/projects.ts";

export const ANSWER_KEYS: readonly AnswerKey[] = [
  "payments",
  "agents",
  "code",
  "looking",
  "contact",
  "decision",
  "stack",
  "status",
  "overview",
  "all",
  "fallback",
];

/** The drawer gives up waiting after this long, in ms. */
export const ASK_CLIENT_TIMEOUT_MS = 6000;
/** Longest answer text the server accepts from the model. */
export const ASK_MAX_ANSWER_CHARS = 2000;

export type AskRequest = {
  question: string;
  scopeId: string | null;
  /** Only chips and picks carry these two. */
  intent?: AnswerKey;
  langSample?: string;
};

export type ModelOutput = { key: AnswerKey; scopeId: string | null; answer: string };

/** What the server did for one answer; the drawer shows it as "under the hood". */
export type AskMeta = {
  /** Ids of the index chunks handed to the model, best first. */
  candidates: string[];
  model: string;
  /** Wall-clock time of the model call, in ms. */
  ms: number;
  usage: { inputTokens: number; outputTokens: number };
  costUsd: number;
};

export type AskResponse =
  | ({ ok: true; meta?: AskMeta } & ModelOutput)
  | { ok: false; error: "invalid" | "unavailable" | "system" }
  | { ok: false; error: "limited"; reason: "visitor" | "budget" };

export const isAnswerKey = (v: unknown): v is AnswerKey =>
  typeof v === "string" && (ANSWER_KEYS as readonly string[]).includes(v);

export const isScopeId = (v: unknown): v is string | null =>
  v === null || (typeof v === "string" && PROJECTS.some((p) => p.id === v));

/** Why a model output failed the structure check. */
export type ModelOutputProblem = "not-json" | "bad-key" | "bad-scope" | "bad-answer";

/** The first structure rule a parsed model output breaks, or null when it passes. */
export function modelOutputProblem(value: unknown): ModelOutputProblem | null {
  if (!value || typeof value !== "object") return "not-json";
  const o = value as Record<string, unknown>;
  if (!isAnswerKey(o.key)) return "bad-key";
  if (!("scopeId" in o) || !isScopeId(o.scopeId)) return "bad-scope";
  if (typeof o.answer !== "string") return "bad-answer";
  if (o.answer.trim() === "" || o.answer.length > ASK_MAX_ANSWER_CHARS) return "bad-answer";
  return null;
}

/**
 * The structure check on what the model returned — a JSON string or a parsed
 * object. It checks shape only: the words in `answer` are never inspected.
 */
export function validateModelOutput(raw: unknown): ModelOutput | null {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (modelOutputProblem(value)) return null;
  const o = value as ModelOutput;
  return { key: o.key, scopeId: o.scopeId, answer: o.answer };
}

/** The meta block of a 200 reply, or null when it is missing or malformed. */
export function readMeta(raw: unknown): AskMeta | null {
  const m = (raw as { meta?: unknown } | null)?.meta;
  if (!m || typeof m !== "object") return null;
  const o = m as Record<string, unknown>;
  const usage = o.usage as Record<string, unknown> | undefined;
  const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
  if (!Array.isArray(o.candidates) || !o.candidates.every((c) => typeof c === "string")) return null;
  if (typeof o.model !== "string" || !num(o.ms) || !num(o.costUsd)) return null;
  if (!usage || !num(usage.inputTokens) || !num(usage.outputTokens)) return null;
  return {
    candidates: o.candidates,
    model: o.model,
    ms: o.ms,
    usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
    costUsd: o.costUsd,
  };
}
