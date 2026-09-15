import Image from "next/image";
import { SITE } from "@/content/copy";
import type { Hue, Project } from "@/content/projects";
import type { Cover } from "@/lib/projectMedia";
import { ProjectArt } from "./ProjectArt";
import styles from "./ProjectCover.module.css";

// Suggested source size is 1600×1200 (4:3) — see CONTENT.md. `unoptimized` keeps
// the file served as-is, so the site needs no image optimizer at build time.
const COVER_W = 1600;
const COVER_H = 1200;

const HUE: Record<Hue, string> = {
  cyan: styles.hueCyan,
  amber: styles.hueAmber,
  blue: styles.hueBlue,
  green: styles.hueGreen,
  violet: styles.hueViolet,
};

/**
 * The 4:3 slot in front of a project. A file at public/projects/<id>/cover.<ext>
 * wins; with no file the placeholder diagram stands in, labelled as a slot.
 */
export function ProjectCover({
  project,
  cover,
  className,
}: {
  project: Project;
  cover: Cover | null;
  className?: string;
}) {
  return (
    <figure className={`${styles.frame} ${HUE[project.hue]} ${className ?? ""}`}>
      {cover ? (
        <Image
          className={styles.img}
          src={cover.src}
          alt={project.name}
          width={COVER_W}
          height={COVER_H}
          unoptimized
        />
      ) : (
        <>
          <ProjectArt id={project.id} />
          <figcaption className={styles.caption}>{SITE.imageSlot}</figcaption>
        </>
      )}
    </figure>
  );
}
