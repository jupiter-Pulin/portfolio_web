// POST /api/ask, as a plain Request → Response function with every dependency
// injectable. Order: validate → count → switch → config → store → visitor limit
// → budget → retrieve → prompt → model (under a deadline) → cost → structure check.
// No failure path falls back to a scripted answer.
import type { AnswerKey } from "../../content/guide.ts";
import {
  isAnswerKey,
  isScopeId,
  type AskRequest,
  type AskResponse,
} from "../../lib/askContract.ts";
import { hashEmbed, topK, type Chunk } from "../../lib/askIndex.ts";
import { askEnabled, isConfigError, maxQuestionChars, readConfig, type Env } from "./config.ts";
import { bump, checkBudget, checkVisitor, clientIp, recordCost, type Metric } from "./limits.ts";
import { readModelOutput } from "./output.ts";
import { buildUserPrompt, normalizeQuestion, SYSTEM_PROMPT } from "./prompt.ts";
import { costUsd, selectProvider, type Provider } from "./providers/index.ts";
import { selectStore, type Log, type Store } from "./store.ts";

/** Candidate passages sent with each question. */
export const TOP_K = 6;

export type AskDeps = {
  env: Env;
  index: readonly Chunk[];
  store?: Store;
  provider?: Provider;
  clock?: () => Date;
  log?: Log;
  fetch?: typeof globalThis.fetch;
};

const json = (status: number, body: AskResponse) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const invalid = () => json(400, { ok: false, error: "invalid" });
const system = (status: number) => json(status, { ok: false, error: "system" });

class Timeout extends Error {}

/** The body, or null when it breaks the request contract. */
function parseBody(raw: unknown, maxChars: number): AskRequest | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const b = raw as Record<string, unknown>;
  const text = (v: unknown) => typeof v === "string" && v.trim() !== "" && v.length <= maxChars;
  if (!text(b.question)) return null;
  if (!("scopeId" in b) || !isScopeId(b.scopeId)) return null;
  if ("intent" in b && b.intent !== undefined && !isAnswerKey(b.intent)) return null;
  if ("langSample" in b && b.langSample !== undefined && !text(b.langSample)) return null;
  return {
    question: b.question as string,
    scopeId: b.scopeId,
    ...(b.intent !== undefined ? { intent: b.intent as AnswerKey } : {}),
    ...(b.langSample !== undefined ? { langSample: (b.langSample as string).trim() } : {}),
  };
}

export function createAskHandler(deps: AskDeps) {
  const env = deps.env;
  const log: Log = deps.log ?? console;
  const clock = deps.clock ?? (() => new Date());
  const fetchFn = deps.fetch ?? globalThis.fetch;
  // Chosen once: the in-memory counters must outlive a single request.
  let chosen: ReturnType<typeof selectStore> | undefined;
  const resolveStore = () => deps.store ?? (chosen ??= selectStore(env, fetchFn, log));

  return async function handle(req: Request): Promise<Response> {
    const now = clock();

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return invalid();
    }
    const body = parseBody(raw, maxQuestionChars(env));
    if (!body) return invalid();

    const storeOrError = resolveStore();
    const store = isConfigError(storeOrError) ? null : storeOrError;
    const failStore = async () => {
      log.error("ask: counter store unavailable");
      // Best effort: the store that just failed may not take this either.
      if (store) await bump(store, "error:store", now).catch(() => {});
      return system(503);
    };
    const count = async (metric: Metric) => {
      if (store) await bump(store, metric, now);
    };

    try {
      await count("requests");
    } catch {
      return failStore();
    }

    if (!askEnabled(env)) {
      try {
        await count("unavailable");
      } catch {
        return failStore();
      }
      return json(503, { ok: false, error: "unavailable" });
    }

    const config = readConfig(env);
    const provider = isConfigError(config) ? null : (deps.provider ?? selectProvider(config, fetchFn));
    if (isConfigError(config) || !provider || !store) {
      const names = isConfigError(config)
        ? config.names
        : isConfigError(storeOrError)
          ? storeOrError.names
          : ["ASK_PROVIDER"];
      log.warn(`ask: configuration incomplete or invalid: ${names.join(", ")}`);
      await count("error:config").catch(() => {});
      return system(503);
    }

    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(), config.serverDeadlineMs);
    try {
      try {
        const ip = clientIp(req.headers);
        if (!(await checkVisitor(store, ip, now, config))) {
          await count("limited:visitor");
          return json(429, { ok: false, error: "limited", reason: "visitor" });
        }
        if (!(await checkBudget(store, now, config))) {
          await count("limited:budget");
          return json(429, { ok: false, error: "limited", reason: "budget" });
        }
      } catch {
        return failStore();
      }

      const question = normalizeQuestion(body.question);
      const langSample = body.langSample === undefined ? undefined : normalizeQuestion(body.langSample);
      const candidates = topK(deps.index, hashEmbed(`${question} ${langSample ?? ""}`), TOP_K);
      const user = buildUserPrompt({ question, scopeId: body.scopeId, intent: body.intent, langSample, candidates });

      let result: Awaited<ReturnType<Provider["ask"]>>;
      const started = Date.now();
      try {
        if (deadline.signal.aborted) throw new Timeout();
        const aborted = new Promise<never>((_, reject) =>
          deadline.signal.addEventListener("abort", () => reject(new Timeout()), { once: true }),
        );
        result = await Promise.race([
          provider.ask({ system: SYSTEM_PROMPT, user, signal: deadline.signal }),
          aborted,
        ]);
      } catch (err) {
        const timedOut = err instanceof Timeout || deadline.signal.aborted;
        log.error(timedOut ? "ask: model call hit the server deadline" : "ask: model call failed");
        await count(timedOut ? "error:timeout" : "error:provider").catch(() => {});
        return system(timedOut ? 504 : 502);
      }

      if (result.usage) {
        try {
          await recordCost(store, now, costUsd(result.usage, config));
        } catch {
          return failStore();
        }
      }

      if (!result.usage) {
        log.warn("ask: model response carried no usage");
        await count("error:invalid").catch(() => {});
        return system(502);
      }
      const read = readModelOutput(result.content);
      if (!read.ok) {
        // How the reply ended tells a cut-off answer from a malformed one without logging its text.
        const finish = result.finishReason ? ` · finish_reason=${result.finishReason}` : "";
        log.warn(
          `ask: model output failed the structure check (${read.reason})${finish} · ${result.usage.outputTokens} output tokens`,
        );
        await count("error:invalid").catch(() => {});
        return system(502);
      }
      const output = read.output;

      await count("answered").catch(() => {});
      return json(200, {
        ok: true,
        key: output.key,
        // "all" leaves every project, whatever the model said.
        scopeId: output.key === "all" ? null : output.scopeId,
        answer: output.answer,
        // What happened on the way, for the "under the hood" panel beneath the answer.
        meta: {
          candidates: candidates.map((c) => c.id),
          model: config.model,
          ms: Date.now() - started,
          usage: result.usage,
          costUsd: costUsd(result.usage, config),
        },
      });
    } finally {
      clearTimeout(timer);
    }
  };
}
