// Shape rules for src/content/projects.ts. Adding a project means editing data,
// so the data has to be checkable: tests/schema.test.mjs runs this over the
// registry and over deliberately broken records.
// Relative import on purpose: tests/schema.test.mjs loads this file directly
// under Node's type stripping, which does not know the "@/" tsconfig alias.
import type { Hue, Project, Status } from "../content/projects";
import { CASE_ART } from "./sketchArt.ts";

export const HUES: Hue[] = ["cyan", "amber", "blue", "green", "violet"];
export const STATUSES: Status[] = ["shipped", "building", "archived"];

const ID = /^[a-z0-9-]+$/;
const GITHUB = "https://github.com/";

/** Every rule a record breaks, one message each. Empty means the record is legal. */
export function validateProject(p: Project): string[] {
  const errors: string[] = [];
  const fail = (msg: string) => errors.push(`${p.id || "<no id>"}: ${msg}`);

  if (!ID.test(p.id)) fail("id must match /^[a-z0-9-]+$/");
  if (!HUES.includes(p.hue)) fail(`hue must be one of ${HUES.join(", ")}`);
  if (p.status !== undefined && !STATUSES.includes(p.status)) {
    fail(`status must be one of ${STATUSES.join(", ")}`);
  }

  // Media files live next to the cover, in public/projects/<id>/.
  const own = (src: string) => src.startsWith(`/projects/${p.id}/`);
  if (p.site) {
    if (!p.site.label) fail("site needs a label");
    if (!p.site.url.startsWith("https://")) fail("site url must be https://");
    if (p.site.url.startsWith(GITHUB)) fail("site is the running product, not a repository");
  }
  if (p.demo) {
    if (!own(p.demo.src) || !p.demo.src.endsWith(".mp4")) fail(`demo src must be an .mp4 in /projects/${p.id}/`);
    if (!own(p.demo.poster)) fail(`demo poster must be in /projects/${p.id}/`);
    if (!p.demo.caption) fail("demo needs a caption");
  }
  if (p.explainer) {
    if (!own(p.explainer.src) || !p.explainer.src.endsWith(".mp4")) fail(`explainer src must be an .mp4 in /projects/${p.id}/`);
    if (!own(p.explainer.poster)) fail(`explainer poster must be in /projects/${p.id}/`);
    if (!p.explainer.caption) fail("explainer needs a caption");
  }
  // A drawing made in code is named by its CASE_ART key; its words are the alt text.
  const drawn = (what: string, d: { art: string; alt: string; caption: string }) => {
    if (!CASE_ART[d.art]) fail(`${what} art "${d.art}" is not a drawing in CASE_ART`);
    if (!d.alt) fail(`${what} needs alt text`);
    if (!d.caption) fail(`${what} needs a caption`);
  };
  if (p.architecture) {
    const a = p.architecture;
    if ("art" in a) drawn("architecture", a);
    else {
      if (!own(a.src)) fail(`architecture src must be in /projects/${p.id}/`);
      if (!a.alt) fail("architecture needs alt text");
      if (!(a.width > 0 && a.height > 0)) fail("architecture needs its width and height");
    }
  }
  if (p.figures) {
    for (const f of p.figures) {
      if (!f.title) fail("a figure needs a title");
      drawn(`figure "${f.title}"`, f);
    }
    if (new Set(p.figures.map((f) => f.art)).size !== p.figures.length) fail("a figure is drawn twice");
  }
  if (p.points) {
    for (const pt of p.points) {
      if (!pt.t || !pt.d) fail("a point needs a title and a sentence");
      if (pt.v && !pt.l) fail(`point "${pt.t}" shows a figure without a label`);
    }
    // Figures keep their provenance, as stats do.
    if (p.points.some((pt) => pt.v) && !p.pointsNote) fail("points with figures need a pointsNote saying where they come from");
  }
  if (p.guarantees) {
    const g = p.guarantees;
    if (!g.lede) fail("guarantees need a lede");
    if (g.pledges.length === 0 || g.pledges.some((x) => !x.t || !x.v || !x.d)) fail("a pledge needs a label, a headline and a sentence");
    if (g.stages.length === 0 || g.stages.some((x) => !x.name || !x.who || !x.does || !x.guard)) {
      fail("a stage needs a name, who runs it, what it does and what happens when it fails");
    }
    // The rail above the stages is drawn as two runs: the ones the user waits for, then the rest.
    if (g.stages.some((x, i) => x.waits && i > 0 && !g.stages[i - 1].waits)) fail("the stages the user waits for come first");
    if (!g.budget.rule || !g.budget.d) fail("the budget line needs its rule and a sentence");
    if (g.rules.length === 0 || g.rules.some((x) => !x.rule || !x.by || !x.broken || !x.proof)) {
      fail("a money rule needs the rule, who enforces it, what happens when it breaks and a proof");
    }
    // Figures keep their provenance, as stats do.
    if (!g.note) fail("guarantees need a note saying where their figures come from");
  }
  if (p.rollout) {
    if (p.rollout.live.length === 0 && p.rollout.fork.length === 0) fail("rollout lists nothing");
    if ([...p.rollout.live, ...p.rollout.fork].some((x) => !x)) fail("rollout has an empty item");
  }

  if (p.private) {
    if (p.repos.length > 0) fail("a private project must not link a repository");
    if (!p.scope) fail("a private project needs a scope note");
  } else {
    if (!p.readmeUrl?.startsWith(GITHUB)) fail("readmeUrl must be a github.com link");
    if (p.repos.length === 0) fail("a public project needs at least one repo");
    for (const r of p.repos) {
      if (!r.url.startsWith(GITHUB)) fail(`repo ${r.label} must be a github.com link`);
    }
  }
  return errors;
}
