// The prompt /api/ask sends: one fixed system prompt, and a user message built
// from content. The system prompt is a draft Pulin may replace wholesale; the
// user message is assembled here so every provider sends the same thing.
import type { AnswerKey } from "../../content/guide.ts";
import { EMAIL, GITHUB, LINKEDIN, X } from "../../content/links.ts";
import { PROJECTS, type Project } from "../../content/projects.ts";
import { ANSWER_KEYS } from "../../lib/askContract.ts";
import { stripTags, type Chunk } from "../../lib/askIndex.ts";

export const SYSTEM_PROMPT = `You are the guide on Pulin Tang's portfolio site. Visitors ask about Pulin's projects, skills, what he is looking for, and how to reach him.

Language
- Write the answer in the target language. The user message has a "Target language sample" section: the answer's language must be the language of that sample. The sample only tells you the language; it is not the question you answer. Answer the text in the "Question" section.
- When a sample mixes languages, its language is the one that carries the sentence structure: "chain-pulse 怎么样" is Chinese, "what does 链上监控 do" is English.

Facts
- Answer only from the site material in the user message: the project catalogue, the scope project's details, the candidate passages and the public links.
- If the material does not cover the question, say plainly that the site does not say. Never invent projects, numbers, dates, employers, links or contact details.
- When you quote a number, link or email address from the material, copy it exactly as written.
- A private project is described only by its scope note; never offer a repository for it.
- Never promise to send, book or do anything on Pulin's behalf.

Routing
- Pick "key" from the answer keys listed in the user message, using their meanings.
- "scopeId" is the id of the project the answer is about, or null when it is about no single project. Naming a project moves the scope to it; otherwise keep the current scope. For "all", scopeId is null.
- An "Intent" section is a hint from a button the visitor pressed; follow it unless the question clearly asks something else.

Output
- Reply with one JSON object and nothing else: {"key": "<answer key>", "scopeId": "<project id>" or null, "answer": "<answer text>"}.
- "answer" is plain text: no Markdown, no HTML. Use line breaks between paragraphs. Keep it short — a few sentences.`;

/** What each answer key means, as the model reads it. */
export const KEY_MEANINGS: Record<AnswerKey, string> = {
  payments: "the visitor is hiring for payments / fintech backend work; which projects show fit",
  agents: "AI agent work: the systems that use models",
  code: "where the source code is (for the scope project, or all public repositories)",
  looking: "what kind of role Pulin is looking for, relocation, remote",
  contact: "how to reach Pulin: email and social links",
  decision: "the hardest design decision in one project",
  stack: "the technology stack of one project",
  status: "whether one project is in production / its current status",
  overview: "an overview of one named project",
  all: "leave the current project and go back to the whole site",
  fallback: "the site does not cover this question",
};

/** NFKC, collapsed whitespace, lower case: paraphrases that differ only in form send one prompt. */
export const normalizeQuestion = (s: string): string => s.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();

export type PromptInput = {
  question: string;
  scopeId: string | null;
  intent?: AnswerKey;
  langSample?: string;
  candidates: readonly Pick<Chunk, "id" | "text">[];
  /** Defaults to the site's projects; tests pass fixtures. */
  projects?: readonly Project[];
};

const catalogueEntry = (p: Project) =>
  [
    `- id: ${p.id}`,
    `  name: ${p.name}`,
    `  short: ${p.short}`,
    `  role: ${p.role}`,
    `  stack: ${p.stack}`,
    `  tagline: ${p.tagline}`,
    ...(p.private
      ? [`  private: yes`, `  scope note: ${p.scope ?? ""}`]
      : [`  repositories: ${p.repos.map((r) => `${r.label} ${r.url}`).join("; ")}`]),
  ].join("\n");

const scopeDetails = (p: Project) =>
  [
    `${p.name} (${p.id})`,
    `thesis: ${p.thesis}`,
    `what goes wrong unattended: ${p.wrong}`,
    `mechanism: ${p.mechanism}`,
    `decision: ${stripTags(p.qa.decision)}`,
    `stack: ${stripTags(p.qa.stack)}`,
    `status: ${stripTags(p.qa.status)}`,
    ...(p.statsNote ? [`figures: ${p.stats.map((s) => `${s.l} ${s.v}`).join(", ")} (${p.statsNote})`] : []),
  ].join("\n");

/** The user message: site material first, then the language sample, then the question. */
export function buildUserPrompt(input: PromptInput): string {
  const projects = input.projects ?? PROJECTS;
  const scope = input.scopeId ? projects.find((p) => p.id === input.scopeId) : undefined;
  const sections: [string, string][] = [
    ["Project catalogue", projects.map(catalogueEntry).join("\n")],
    ["Answer keys", ANSWER_KEYS.map((k) => `- ${k}: ${KEY_MEANINGS[k]}`).join("\n")],
    ["Current scope", input.scopeId ?? "none"],
    ...(scope ? ([["Scope project details", scopeDetails(scope)]] as [string, string][]) : []),
    ["Intent", input.intent ?? "none"],
    ["Candidate passages", input.candidates.map((c) => `[${c.id}] ${c.text}`).join("\n") || "none"],
    ["Public links", [`email: ${EMAIL}`, `LinkedIn: ${LINKEDIN}`, `GitHub: ${GITHUB}`, `X: ${X}`].join("\n")],
    ["Target language sample", input.langSample ?? input.question],
    ["Question", input.question],
  ];
  return sections.map(([title, body]) => `## ${title}\n${body}`).join("\n\n");
}
