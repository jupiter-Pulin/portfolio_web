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
