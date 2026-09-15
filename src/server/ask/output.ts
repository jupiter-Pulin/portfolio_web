// Reading the model's reply before the structure check. Only lossless repairs:
// a JSON object wrapped in a code fence or stray prose is unwrapped, and a
// scopeId written as a project's name (or an id in another case) becomes that
// project's id. The answer text is never touched; nothing is made up.
import { modelOutputProblem, type ModelOutput, type ModelOutputProblem } from "../../lib/askContract.ts";
import { PROJECTS } from "../../content/projects.ts";

export type ReadOutput = { ok: true; output: ModelOutput } | { ok: false; reason: ModelOutputProblem };

function parseObject(content: string): unknown {
  const text = content.trim();
  try {
    return JSON.parse(text);
  } catch {
    // A fence (```json … ```) or a sentence around the object: take the outermost braces.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

export function readModelOutput(content: string): ReadOutput {
  const value = parseObject(content);
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, reason: "not-json" };
  const o = { ...(value as Record<string, unknown>) };
  if (typeof o.scopeId === "string") {
    const wanted = o.scopeId.trim().toLowerCase();
    const project = PROJECTS.find((p) => p.id.toLowerCase() === wanted || p.name.toLowerCase() === wanted);
    if (project) o.scopeId = project.id;
  }
  const reason = modelOutputProblem(o);
  if (reason) return { ok: false, reason };
  const out = o as ModelOutput;
  return { ok: true, output: { key: out.key, scopeId: out.scopeId, answer: out.answer } };
}
