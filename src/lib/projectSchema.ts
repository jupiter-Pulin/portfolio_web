// Shape rules for src/content/projects.ts. Adding a project means editing data,
// so the data has to be checkable: tests/schema.test.mjs runs this over the
// registry and over deliberately broken records.
// Relative import on purpose: tests/schema.test.mjs loads this file directly
// under Node's type stripping, which does not know the "@/" tsconfig alias.
import type { Hue, Project, Status } from "../content/projects";

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
  if (p.architecture) {
    if (!own(p.architecture.src)) fail(`architecture src must be in /projects/${p.id}/`);
    if (!p.architecture.alt) fail("architecture needs alt text");
    if (!(p.architecture.width > 0 && p.architecture.height > 0)) fail("architecture needs its width and height");
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
