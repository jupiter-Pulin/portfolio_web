// Paid model providers behind one interface. Adding one is a new file here plus
// a line in selectProvider; prompt, cost and the structure check stay shared.
import type { Config } from "../config.ts";
import { createOpenAiCompatible } from "./openaiCompatible.ts";

export type Usage = { inputTokens: number; outputTokens: number };

export type Provider = {
  id: string;
  /** `usage` is null when the provider's response did not report it. */
  ask(req: { system: string; user: string; signal: AbortSignal }): Promise<{ content: string; usage: Usage | null }>;
};

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

export function selectProvider(config: Config, fetch: typeof globalThis.fetch): Provider | null {
  switch (config.provider) {
    case "openai-compatible":
      return createOpenAiCompatible(config, fetch);
    default:
      return null;
  }
}

/** USD for one call at the configured per-million-token prices. */
export const costUsd = (usage: Usage, cfg: Pick<Config, "priceInputPerMTok" | "priceOutputPerMTok">) =>
  (usage.inputTokens * cfg.priceInputPerMTok + usage.outputTokens * cfg.priceOutputPerMTok) / 1e6;
