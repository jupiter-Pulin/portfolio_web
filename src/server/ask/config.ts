// /api/ask configuration, read from server-only env. Errors name the variables
// that are missing or malformed and never carry a value.
import { GUIDE } from "../../content/guide.ts";
import { ASK_CLIENT_TIMEOUT_MS } from "../../lib/askContract.ts";

export type Env = Record<string, string | undefined>;

export type Config = {
  /** NODE_ENV is not "production": in-memory counters and a built-in salt are allowed. */
  dev: boolean;
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  priceInputPerMTok: number;
  priceOutputPerMTok: number;
  upstash: { url: string; token: string } | null;
  ipSalt: string;
  dailyBudgetUsd: number;
  monthlyBudgetUsd: number;
  visitorDailyLimit: number;
  maxQuestionChars: number;
  serverDeadlineMs: number;
};

export type ConfigError = { error: "config"; names: string[] };

export const PROVIDERS = ["openai-compatible"] as const;

/** Only used outside production, when ASK_IP_SALT is not set. */
export const DEV_IP_SALT = "portfolio-web-dev-salt";

export const isProduction = (env: Env) => env.NODE_ENV === "production";

/** ASK_ENABLED defaults to on; only an explicit false switches the guide off. */
export const askEnabled = (env: Env) => !/^(false|0|off|no)$/i.test((env.ASK_ENABLED ?? "").trim());

const present = (v: string | undefined): v is string => typeof v === "string" && v.trim() !== "";

/** A positive number from env, the default when unset, or NaN when malformed. */
function num(env: Env, name: string, fallback?: number): number {
  const raw = env[name];
  if (!present(raw)) return fallback ?? NaN;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

/** The question limit is needed before the rest of the config is read. */
export function maxQuestionChars(env: Env): number {
  const n = num(env, "ASK_MAX_QUESTION_CHARS", GUIDE.limits.maxQuestionChars);
  return Number.isInteger(n) && n > 0 ? n : GUIDE.limits.maxQuestionChars;
}

export function readConfig(env: Env): Config | ConfigError {
  const names: string[] = [];
  const need = (name: string): string => {
    const v = env[name];
    if (!present(v)) {
      names.push(name);
      return "";
    }
    return v.trim();
  };
  const number = (name: string, fallback?: number): number => {
    const n = num(env, name, fallback);
    if (Number.isNaN(n)) names.push(name);
    return n;
  };

  const dev = !isProduction(env);
  const provider = present(env.ASK_PROVIDER) ? env.ASK_PROVIDER.trim() : "openai-compatible";
  if (!(PROVIDERS as readonly string[]).includes(provider)) names.push("ASK_PROVIDER");

  const baseUrl = need("ASK_MODEL_BASE_URL");
  const model = need("ASK_MODEL");
  const apiKey = need("ASK_MODEL_API_KEY");
  const priceInputPerMTok = number("ASK_PRICE_INPUT_USD_PER_MTOK");
  const priceOutputPerMTok = number("ASK_PRICE_OUTPUT_USD_PER_MTOK");

  const hasUpstash = present(env.UPSTASH_REDIS_REST_URL) && present(env.UPSTASH_REDIS_REST_TOKEN);
  if (!dev && !hasUpstash) {
    if (!present(env.UPSTASH_REDIS_REST_URL)) names.push("UPSTASH_REDIS_REST_URL");
    if (!present(env.UPSTASH_REDIS_REST_TOKEN)) names.push("UPSTASH_REDIS_REST_TOKEN");
  }
  let ipSalt = DEV_IP_SALT;
  if (present(env.ASK_IP_SALT)) ipSalt = env.ASK_IP_SALT;
  else if (!dev) names.push("ASK_IP_SALT");

  const dailyBudgetUsd = number("ASK_DAILY_BUDGET_USD", 2);
  const monthlyBudgetUsd = number("ASK_MONTHLY_BUDGET_USD", 20);
  const visitorDailyLimit = number("ASK_VISITOR_DAILY_LIMIT", 10);
  const questionChars = number("ASK_MAX_QUESTION_CHARS", GUIDE.limits.maxQuestionChars);
  const serverDeadlineMs = number("ASK_SERVER_DEADLINE_MS", 5000);
  // The server must give up before the drawer does.
  if (!Number.isNaN(serverDeadlineMs) && (serverDeadlineMs >= ASK_CLIENT_TIMEOUT_MS || serverDeadlineMs <= 0)) {
    names.push("ASK_SERVER_DEADLINE_MS");
  }

  if (names.length) return { error: "config", names };
  return {
    dev,
    provider,
    baseUrl,
    model,
    apiKey,
    priceInputPerMTok,
    priceOutputPerMTok,
    upstash: hasUpstash
      ? { url: (env.UPSTASH_REDIS_REST_URL as string).trim(), token: (env.UPSTASH_REDIS_REST_TOKEN as string).trim() }
      : null,
    ipSalt,
    dailyBudgetUsd,
    monthlyBudgetUsd,
    visitorDailyLimit,
    maxQuestionChars: questionChars,
    serverDeadlineMs,
  };
}

export const isConfigError = (v: unknown): v is ConfigError =>
  !!v && typeof v === "object" && (v as ConfigError).error === "config";
