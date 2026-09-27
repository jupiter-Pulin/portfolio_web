import Image from "next/image";
import { SITE } from "@/content/copy";
import type { Project } from "@/content/projects";
import type { Cover } from "@/lib/projectMedia";
import { Drawing } from "./sketch/Drawing";
import { Sketch } from "./sketch/Sketch";
import styles from "./ProjectCover.module.css";

// Suggested source size is 1600×1200 (4:3) — see CONTENT.md. `unoptimized` keeps
// the file served as-is, so the site needs no image optimizer at build time.
const COVER_W = 1600;
const COVER_H = 1200;

/**
 * A project's picture, taped onto the page. A file at public/projects/<id>/cover.<ext>
 * wins; with no file the project's own little diagram stands in, labelled as a slot.
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
    <figure className={`sk ${styles.frame} ${className ?? ""}`}>
      <Sketch fill="var(--white)" r={8} w={2.4} />
      <Drawing kind="tape" className={styles.tape} />
      {cover ? (
        <Image className={styles.img} src={cover.src} alt={project.name} width={COVER_W} height={COVER_H} unoptimized />
      ) : (
        <>
          <Drawing kind="project" id={project.id} className={styles.art} draw={200} dur={1100} />
          <figcaption className={styles.caption}>{SITE.imageSlot}</figcaption>
        </>
      )}
    </figure>
  );
}
