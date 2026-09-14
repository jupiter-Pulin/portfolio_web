// Cover images live on disk, not in the registry: drop a file at
// public/projects/<id>/cover.<ext> and the build picks it up. Server-only —
// importing this from a client component would drag node:fs into the browser bundle.
import { existsSync } from "node:fs";
import { join } from "node:path";

/** Checked in order; the first file that exists wins. */
export const COVER_EXTENSIONS = ["webp", "png", "jpg"] as const;

export type Cover = { src: string };

/** Public path of the cover for `id`, or null when no file has been dropped yet. */
export function resolveCover(id: string, { root = process.cwd() }: { root?: string } = {}): Cover | null {
  for (const ext of COVER_EXTENSIONS) {
    if (existsSync(join(root, "public", "projects", id, `cover.${ext}`))) {
      return { src: `/projects/${id}/cover.${ext}` };
    }
  }
  return null;
}
