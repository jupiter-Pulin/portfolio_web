// Rate limits, budget and the 30-day counters for /api/ask. Keys carry the UTC
// day (or month) and a hashed IP; no question text and no plain IP is written.
import { createHmac } from "node:crypto";
import type { Store } from "./store.ts";

export const COUNTER_TTL_SEC = 30 * 24 * 60 * 60;
export const MONTH_TTL_SEC = 40 * 24 * 60 * 60;
export const VISITOR_TTL_SEC = 2 * 24 * 60 * 60;

export type Metric =
  | "requests"
  | "answered"
  | "limited:visitor"
  | "limited:budget"
  | "unavailable"
  | "error:provider"
  | "error:timeout"
  | "error:invalid"
  | "error:config"
  | "error:store"
  | "cost";

const utcDay = (now: Date) => now.toISOString().slice(0, 10);
const utcMonth = (now: Date) => now.toISOString().slice(0, 7);

export const dayKey = (now: Date, metric: Metric) => `ask:day:${utcDay(now)}:${metric}`;
export const monthKey = (now: Date) => `ask:month:${utcMonth(now)}:cost`;

export const visitorKey = (ip: string, salt: string, now: Date) =>
  `ask:visitor:${utcDay(now)}:${createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32)}`;

/** First x-forwarded-for hop, then x-real-ip, then "unknown". Shared exits share a quota. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const real = headers.get("x-real-ip")?.trim();
  return real || "unknown";
}

/** Count this visit, then say whether it is still within the daily limit. */
export async function checkVisitor(
  store: Store,
  ip: string,
  now: Date,
  cfg: { ipSalt: string; visitorDailyLimit: number },
): Promise<boolean> {
  const count = await store.incr(visitorKey(ip, cfg.ipSalt, now), VISITOR_TTL_SEC);
  return count <= cfg.visitorDailyLimit;
}

/** Check before calling: false once today's or this month's spend has reached its threshold. */
export async function checkBudget(
  store: Store,
  now: Date,
  cfg: { dailyBudgetUsd: number; monthlyBudgetUsd: number },
): Promise<boolean> {
  const [day, month] = await Promise.all([store.get(dayKey(now, "cost")), store.get(monthKey(now))]);
  return Number(day ?? 0) < cfg.dailyBudgetUsd && Number(month ?? 0) < cfg.monthlyBudgetUsd;
}

export async function recordCost(store: Store, now: Date, usd: number): Promise<void> {
  await store.incrByFloat(dayKey(now, "cost"), usd, COUNTER_TTL_SEC);
  await store.incrByFloat(monthKey(now), usd, MONTH_TTL_SEC);
}

export async function bump(store: Store, metric: Metric, now: Date): Promise<void> {
  await store.incr(dayKey(now, metric), COUNTER_TTL_SEC);
}
