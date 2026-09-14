// A chat-completions provider for any OpenAI-compatible HTTP API (first target:
// DeepSeek). Model name, base URL and key all come from config.
import type { Config } from "../config.ts";
import { ProviderError, type Provider, type Usage } from "./index.ts";

type FetchFn = typeof fetch;

export function createOpenAiCompatible(
  config: Pick<Config, "baseUrl" | "model" | "apiKey">,
  fetch: FetchFn,
): Provider {
  const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  return {
    id: "openai-compatible",
    async ask({ system, user, signal }) {
      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: config.model,
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          }),
          signal,
          cache: "no-store",
        });
      } catch (err) {
        if (signal.aborted) throw err;
        throw new ProviderError("model request failed");
      }
      // Any non-2xx — an outage, a bad key, an exhausted balance — is a provider error.
      if (!res.ok) throw new ProviderError(`model responded ${res.status}`);
      let body: {
        choices?: { message?: { content?: unknown } }[];
        usage?: { prompt_tokens?: unknown; completion_tokens?: unknown };
      };
      try {
        body = await res.json();
      } catch {
        throw new ProviderError("model response was not JSON");
      }
      const content = body?.choices?.[0]?.message?.content;
      const input = body?.usage?.prompt_tokens;
      const output = body?.usage?.completion_tokens;
      const usage: Usage | null =
        typeof input === "number" && typeof output === "number" ? { inputTokens: input, outputTokens: output } : null;
      return { content: typeof content === "string" ? content : "", usage };
    },
  };
}
