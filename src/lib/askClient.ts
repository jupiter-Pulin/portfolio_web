// The drawer's side of /api/ask, as pure functions: what to send, how to read the
// reply, and how the transcript changes around one request. The component only
// wires these to state and events.
import type { AnswerKey } from "../content/guide.ts";
import { GUIDE } from "../content/guide.ts";
import { ASK_CLIENT_TIMEOUT_MS, validateModelOutput, type AskRequest } from "./askContract.ts";
import {
  errorBlocks,
  limitedBlocks,
  modelAnswerBlocks,
  unavailableBlocks,
  type Block,
  type CopyLang,
} from "./guideAnswer.ts";

export type AskInput =
  | { via: "typed"; question: string }
  | { via: "chip" | "pick"; question: string; intent: AnswerKey };

/** What the drawer remembers between requests. */
export type Convo = { scopeId: string | null; langSample: string | null };

export type AskResult =
  | { kind: "answer"; key: AnswerKey; scopeId: string | null; answer: string }
  | { kind: "limited" }
  | { kind: "unavailable" }
  | { kind: "error" };

/**
 * A typed question is its own language sample. A chip or pick carries its intent
 * and the visitor's last typed question, so the answer stays in their language.
 */
export function askBody(input: AskInput, convo: Convo): AskRequest {
  const question = input.question.trim();
  if (input.via === "typed") return { question, scopeId: convo.scopeId };
  return {
    question,
    scopeId: convo.scopeId,
    intent: input.intent,
    ...(convo.langSample ? { langSample: convo.langSample } : {}),
  };
}

/** Only something the visitor typed changes the language sample. */
export const nextLangSample = (prev: string | null, input: AskInput): string | null =>
  input.via === "typed" ? input.question.trim() : prev;

/** The language of the fixed copy: Chinese when the last typed question has a Han character. */
export const copyLang = (sample: string | null): CopyLang =>
  sample && /\p{Script=Han}/u.test(sample) ? "zh" : "en";

/** POST /api/ask and fold every outcome into four kinds. Never throws. */
export async function askGuide(
  body: AskRequest,
  { fetch = globalThis.fetch, timeoutMs = ASK_CLIENT_TIMEOUT_MS }: { fetch?: typeof globalThis.fetch; timeoutMs?: number } = {},
): Promise<AskResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<AskResult>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({ kind: "error" });
    }, timeoutMs);
  });
  const request = (async (): Promise<AskResult> => {
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.status === 429) return { kind: "limited" };
      const data: unknown = await res.json().catch(() => null);
      if (res.status === 503 && (data as { error?: unknown } | null)?.error === "unavailable") {
        return { kind: "unavailable" };
      }
      if (res.status !== 200 || (data as { ok?: unknown } | null)?.ok !== true) return { kind: "error" };
      const output = validateModelOutput(data);
      return output ? { kind: "answer", ...output } : { kind: "error" };
    } catch {
      return { kind: "error" };
    }
  })();
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** One transcript entry. A guide entry is either a typing placeholder or blocks. */
export type ChatMsg = {
  key: number;
  who: "you" | "guide";
  text?: string;
  blocks?: Block[];
  typing?: string;
};

export const nextKey = (msgs: readonly ChatMsg[]) => msgs.reduce((max, m) => Math.max(max, m.key + 1), 0);

/** A request is in flight while a typing placeholder is on screen. */
export const isPending = (msgs: readonly ChatMsg[]) => msgs.some((m) => m.typing !== undefined);

/**
 * The visitor's line and "guide is typing…", together. While a request is
 * already in flight nothing is added — the caller sends nothing either.
 */
export function pendingMsgs(msgs: ChatMsg[], echo: string): ChatMsg[] {
  if (isPending(msgs)) return msgs;
  const key = nextKey(msgs);
  return [...msgs, { key, who: "you", text: echo }, { key: key + 1, who: "guide", typing: GUIDE.typing }];
}

/**
 * Swap the placeholder for the outcome. An answer brings its scope; every other
 * outcome keeps the scope the request was sent with and shows fixed copy in the
 * language of the sample that request carried.
 */
export function settleMsgs(
  msgs: ChatMsg[],
  result: AskResult,
  sent: { scopeId: string | null; langSample: string | null },
): { msgs: ChatMsg[]; scopeId: string | null } {
  const lang = copyLang(sent.langSample);
  const blocks =
    result.kind === "answer"
      ? modelAnswerBlocks(result.answer, result.key, result.scopeId)
      : result.kind === "limited"
        ? limitedBlocks(lang)
        : result.kind === "unavailable"
          ? unavailableBlocks(lang)
          : errorBlocks(lang);
  return {
    msgs: msgs.map((m) => (m.typing !== undefined ? { key: m.key, who: "guide", blocks } : m)),
    scopeId: result.kind === "answer" ? result.scopeId : sent.scopeId,
  };
}
