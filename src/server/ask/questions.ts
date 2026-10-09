// What visitors asked, kept so Nolan can read it back: every question that reached
// the model, with its outcome and the answer, as JSON in one Redis list per UTC day
// that expires 30 days after its last entry. Refused requests (limits, budget, switch)
// never get here, so the list grows no faster than paid model calls. The visitor is
// the salted IP hash the daily limit uses, never the IP.
import type { AnswerKey } from "../../content/guide.ts";
import { COUNTER_TTL_SEC, type Metric } from "./limits.ts";
import type { Store } from "./store.ts";

export const questionsKey = (now: Date) => `ask:questions:${now.toISOString().slice(0, 10)}`;

export type QuestionOutcome = Extract<Metric, "answered" | "error:provider" | "error:timeout" | "error:invalid">;

export type QuestionRecord = {
  at: string;
  visitor: string;
  question: string;
  scopeId: string | null;
  intent?: AnswerKey;
  outcome: QuestionOutcome;
  key?: AnswerKey;
  answer?: string;
};

export async function recordQuestion(store: Store, now: Date, record: Omit<QuestionRecord, "at">): Promise<void> {
  await store.push(questionsKey(now), JSON.stringify({ at: now.toISOString(), ...record }), COUNTER_TTL_SEC);
}
