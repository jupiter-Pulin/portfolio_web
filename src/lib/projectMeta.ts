// Derived labels for a registry record. Pure so the gallery badge and the case
// eyebrow can be asserted against in-memory records, without building the site.
import type { Project } from "../content/projects";

export const BUILDING_BADGE = "building";

/** The badge a gallery card shows, or null. Only `building` earns one. */
export function statusBadge(project: Pick<Project, "status">): string | null {
  return project.status === BUILDING_BADGE ? BUILDING_BADGE : null;
}

/** Case-page eyebrow: the role, plus the ISO `updated` date when the record carries one. */
export function detailEyebrow(project: Pick<Project, "role" | "updated">): string {
  return project.updated ? `${project.role} · updated ${project.updated}` : project.role;
}

export type Stamp = "live" | "open" | "capstone";

/**
 * The little stamps on a project card, read off the record: live when it has a
 * site or says so in its role, then capstone / open source. A private project
 * gets no stamp of its own: the page shows the product, not where its code lives.
 */
export function projectStamps(p: Pick<Project, "role" | "private" | "site">): Stamp[] {
  const role = p.role.toLowerCase();
  const stamps: Stamp[] = [];
  if (p.site || /\blive\b/.test(role)) stamps.push("live");
  if (p.private) return stamps;
  if (role.includes("capstone")) stamps.push("capstone");
  else if (role.includes("open source")) stamps.push("open");
  return stamps;
}

/** The first few parts of a stack line, as tags. */
export const stackTags = (stack: string, max = 4): string[] =>
  stack
    .split(" · ")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);

/** "Role words · accent words": the part after the last " · " is the one underlined. */
export function splitRole(role: string): [string, string] {
  const at = role.lastIndexOf(" · ");
  return at < 0 ? [role, ""] : [role.slice(0, at), role.slice(at + 3)];
}
