// The prompt /api/ask sends: one fixed system prompt, and a user message built
// from content. The system prompt is a draft Pulin may replace wholesale; the
// user message is assembled here so every provider sends the same thing.
import BLOG_POSTS from "../../generated/ask-blog.json" with { type: "json" };
import { GUIDE, type AnswerKey } from "../../content/guide.ts";
import { EMAIL, GITHUB, LINKEDIN, X } from "../../content/links.ts";
import { LOOKING, PROJECTS, type Project } from "../../content/projects.ts";
import { ANSWER_KEYS } from "../../lib/askContract.ts";
import { stripTags, type AskBlogEntry, type Chunk } from "../../lib/askIndex.ts";

export const SYSTEM_PROMPT = `You are the guide on Nolan Tang's portfolio site. Visitors ask about Nolan's projects, skills, what he is looking for, and how to reach him.

Language
- Write the answer in the target language. The user message has a "Target language sample" section: the answer's language must be the language of that sample. The sample only tells you the language; it is not the question you answer. Answer the text in the "Question" section.
- When a sample mixes languages, its language is the one that carries the sentence structure: "AMM DEX 怎么样" is Chinese, "what does 链上监控 do" is English.
- Everything you write is in that language, even when the answer is mostly addresses or links: introduce them in a sentence in the target language, and copy the addresses and links themselves unchanged.

Facts
- Answer only from the site material in the user message: the project catalogue, what Nolan is looking for, the site-wide summaries, the blog posts, the scope project's details, the candidate passages (blog passages among them, their ids start with "blog:") and the public links.
- When the answer uses a blog post or one of its passages, add that post's link /blog/<slug>, copied exactly as the "Blog posts" section writes it.
- If the material does not cover the question, say plainly that the site does not say. Never invent projects, numbers, dates, employers, links or contact details.
- When you quote a number, link or email address from the material, copy it exactly as written.
- A private project is described only by its scope note; never offer a repository for it.
- Never promise to send, book or do anything on Nolan's behalf.

Routing
- Pick "key" from the answer keys listed in the user message, using their meanings. The same question asked in any language, or in other words, gets the same key and scopeId.
- Site-wide keys — "payments", "agents", "looking", "contact" and "all" — are about Nolan or the whole site, so their scopeId is null. That holds even when one project is an example of the topic (a question about his AI agent work is "agents" with scopeId null) and even when a scope is current. Only when the visitor names one project in the question does a site-wide question take that project's id.
- Project keys — "code", "decision", "stack", "status" and "overview" — take the id of the project the question names; when it names none, keep the current scope, which may be null.
- Use "fallback" only when nothing in the material relates to the question. A question a blog post or blog passage answers is never "fallback": pick the key its topic fits (a post about agent workflows is "agents"), or "all" with scopeId null when none fits. The kind of role Nolan wants, relocation and remote work are covered by the "What Nolan is looking for" section: that is "looking", never "fallback".
- An "Intent" section is a hint from a button the visitor pressed; follow it unless the question clearly asks something else.

Output
- Reply with one JSON object and nothing else: {"key": "<answer key>", "scopeId": "<project id>" or null, "answer": "<answer text>"}.
- "answer" is plain text: no Markdown, no HTML. Use line breaks between paragraphs. Keep it short — a few sentences.`;

/** What each answer key means, as the model reads it. */
export const KEY_MEANINGS: Record<AnswerKey, string> = {
  payments: "site-wide (scopeId null): the visitor is hiring for payments / fintech / backend work and asks whether Nolan fits; which projects show fit",
  agents: "site-wide (scopeId null): Nolan's AI agent work as a whole — which systems use models, including this guide",
  code: "project key: where the source code is — the named or current project's repositories, or all public repositories when there is no project",
  looking: "site-wide (scopeId null): what kind of job or role Nolan is looking for, the work he wants next, relocation, remote",
  contact: "site-wide (scopeId null): how to reach Nolan — email, LinkedIn, GitHub, X",
  decision: "project key: the hardest design decision or trade-off in one project",
  stack: "project key: the technologies / tech stack one project uses",
  status: "project key: whether one project is in production, live or in use; its current status",
  overview: "project key: what one project is — an introduction or summary of it",
  all: "site-wide (scopeId null): leave the current project and go back to the whole site",
  fallback: "only when nothing in the site material relates to the question",
};

/** NFKC and collapsed whitespace; case is kept, so the model reads the visitor's own words. */
export const normalizeQuestion = (s: string): string => s.normalize("NFKC").replace(/\s+/g, " ").trim();

export type PromptInput = {
  question: string;
  scopeId: string | null;
  intent?: AnswerKey;
  langSample?: string;
  candidates: readonly Pick<Chunk, "id" | "text">[];
  /** Defaults to the site's projects; tests pass fixtures. */
  projects?: readonly Project[];
  /** Defaults to src/generated/ask-blog.json; tests pass fixtures. */
  posts?: readonly AskBlogEntry[];
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

// The site-wide answers are sent every time: retrieval ranks by shared words, so a
// question in another language can miss them and the model would call it uncovered.
type SiteItem = { id?: string; lead?: string; text: string };
const siteLines = (topic: string, items: readonly SiteItem[]) =>
  items.map((item) => `- ${topic} · ${item.id ?? item.lead}: ${stripTags(item.text)}`);
const siteWide = () =>
  [...siteLines("payments fit", GUIDE.fit.items), ...siteLines("AI agent work", GUIDE.agents.items)].join("\n");

// The post list is sent every time, like the summaries: a passage only shows up when retrieval ranks it.
const blogLines = (posts: readonly AskBlogEntry[]) =>
  posts.map((p) => `- ${p.title} · tags: ${p.tags.join(", ") || "none"} · ${p.href}`).join("\n") || "none";

/** The user message: site material first, then the language sample, then the question. */
export function buildUserPrompt(input: PromptInput): string {
  const projects = input.projects ?? PROJECTS;
  const scope = input.scopeId ? projects.find((p) => p.id === input.scopeId) : undefined;
  const sections: [string, string][] = [
    ["Project catalogue", projects.map(catalogueEntry).join("\n")],
    ["What Nolan is looking for", LOOKING],
    ["Site-wide summaries", siteWide()],
    ["Blog posts", blogLines(input.posts ?? BLOG_POSTS)],
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
