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

export type AskResponse =
  | ({ ok: true } & ModelOutput)
  | { ok: false; error: "invalid" | "unavailable" | "system" }
  | { ok: false; error: "limited"; reason: "visitor" | "budget" };

export const isAnswerKey = (v: unknown): v is AnswerKey =>
  typeof v === "string" && (ANSWER_KEYS as readonly string[]).includes(v);

export const isScopeId = (v: unknown): v is string | null =>
  v === null || (typeof v === "string" && PROJECTS.some((p) => p.id === v));

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
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (!isAnswerKey(o.key)) return null;
  if (!("scopeId" in o) || !isScopeId(o.scopeId)) return null;
  if (typeof o.answer !== "string") return null;
  if (o.answer.trim() === "" || o.answer.length > ASK_MAX_ANSWER_CHARS) return null;
  return { key: o.key, scopeId: o.scopeId, answer: o.answer };
}
