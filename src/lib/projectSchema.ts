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
