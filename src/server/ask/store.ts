// Counters for /api/ask: Upstash Redis over its REST API in production, a
// process-local Map for development and tests. Both speak the same three calls.
import { isProduction, type ConfigError, type Env } from "./config.ts";

export type Store = {
  kind: "memory" | "upstash";
  /** Add 1 and (re)set the TTL; resolves to the new count. */
  incr(key: string, ttlSec: number): Promise<number>;
  /** Add `delta` and (re)set the TTL; resolves to the new total. */
  incrByFloat(key: string, delta: number, ttlSec: number): Promise<number>;
  get(key: string): Promise<string | null>;
};

export type Log = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

type FetchFn = typeof fetch;

export function createMemoryStore(now: () => number = Date.now): Store {
  const data = new Map<string, { value: string; expires: number }>();
  const live = (key: string) => {
    const hit = data.get(key);
    if (hit && hit.expires <= now()) {
      data.delete(key);
      return undefined;
    }
    return hit;
  };
  const add = (key: string, delta: number, ttlSec: number) => {
    const next = Number(live(key)?.value ?? 0) + delta;
    data.set(key, { value: String(next), expires: now() + ttlSec * 1000 });
    return next;
  };
  return {
    kind: "memory",
    incr: async (key, ttlSec) => add(key, 1, ttlSec),
    incrByFloat: async (key, delta, ttlSec) => add(key, delta, ttlSec),
    get: async (key) => live(key)?.value ?? null,
  };
}

export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreError";
  }
}

/** Upstash REST: every call is one pipeline POST. Failures never echo the URL or token. */
export function createUpstashStore({ url, token, fetch }: { url: string; token: string; fetch: FetchFn }): Store {
  const endpoint = `${url.replace(/\/+$/, "")}/pipeline`;
  const pipeline = async (commands: (string | number)[][]): Promise<unknown[]> => {
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(commands),
        cache: "no-store",
      });
    } catch {
      throw new StoreError("upstash request failed");
    }
    if (!res.ok) throw new StoreError(`upstash responded ${res.status}`);
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new StoreError("upstash response was not JSON");
    }
    if (!Array.isArray(body)) throw new StoreError("upstash response was not a pipeline result");
    return body.map((item) => {
      if (!item || typeof item !== "object" || "error" in item) throw new StoreError("upstash command failed");
      return (item as { result: unknown }).result;
    });
  };
  const toNumber = (v: unknown) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new StoreError("upstash returned a non-number");
    return n;
  };
  return {
    kind: "upstash",
    incr: async (key, ttlSec) => toNumber((await pipeline([["INCR", key], ["EXPIRE", key, ttlSec]]))[0]),
    incrByFloat: async (key, delta, ttlSec) =>
      toNumber((await pipeline([["INCRBYFLOAT", key, String(delta)], ["EXPIRE", key, ttlSec]]))[0]),
    get: async (key) => {
      const [v] = await pipeline([["GET", key]]);
      return v === null || v === undefined ? null : String(v);
    },
  };
}

/**
 * Upstash when both env vars are set. Otherwise production is a configuration
 * error, and anywhere else the counters live in this process (and say so once).
 */
export function selectStore(env: Env, fetch: FetchFn, log: Log): Store | ConfigError {
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) return createUpstashStore({ url, token, fetch });
  if (isProduction(env)) {
    return {
      error: "config",
      names: [...(url ? [] : ["UPSTASH_REDIS_REST_URL"]), ...(token ? [] : ["UPSTASH_REDIS_REST_TOKEN"])],
    };
  }
  log.info(
    "ask: no Upstash env outside production — using in-memory counters for this process; model calls are still real and billed",
  );
  return createMemoryStore();
}
