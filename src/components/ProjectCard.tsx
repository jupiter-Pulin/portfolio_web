import Link from "next/link";
import type { CSSProperties } from "react";
import { HOME } from "@/content/copy";
import type { Project } from "@/content/projects";
import { projectStamps, stackTags } from "@/lib/projectMeta";
import { HUE_VAR } from "@/lib/sketchArt";
import { AskAbout } from "./AskAbout";
import { Drawing } from "./sketch/Drawing";
import { Sketch } from "./sketch/Sketch";
import styles from "./ProjectCard.module.css";

// Each card sits a little askew, like paper on a desk.
const TILT = [-0.7, 0.6, -0.4, 0.8, -0.6];

/**
 * One project on a card: its little diagram, name and stamps, the short line and
 * the first stack parts. The whole card opens the case page ("Read the case" is
 * stretched over it); "ask about it" opens the assistant already scoped to the project.
 */
export function ProjectCard({
  project: p,
  index,
  featured = false,
  heading = "h3",
}: {
  project: Project;
  index: number;
  featured?: boolean;
  heading?: "h2" | "h3";
}) {
  const H = heading;
  return (
    <article
      id={`card-${p.id}`}
      className={`sk ${styles.card}${featured ? ` ${styles.feature}` : ""}`}
      style={{ "--rot": `${TILT[index % TILT.length]}deg` } as CSSProperties}
    >
      <Sketch fill="var(--white)" r={16} w={2.6} band={12} bandColor={HUE_VAR[p.hue]} />
      <Drawing kind="project" id={p.id} className={styles.art} draw={150} dur={1100} />
      <div className={styles.t}>
        <H className={styles.name}>
          <Link href={`/work/${p.id}`}>{p.name}</Link>
        </H>
        {projectStamps(p).map((s) => (
          <span key={s} className={`sk ${styles.stamp}${s === "live" ? "" : ` ${styles.grey}`}`}>
            <Sketch r={6} w={1.8} c={s === "live" ? "var(--pink)" : "var(--grey)"} draw={false} />
            {HOME.stamps[s]}
          </span>
        ))}
      </div>
      <p className={styles.role}>{p.role}</p>
      <p className={styles.short}>{p.short}</p>
      <div className={styles.tags}>
        {stackTags(p.stack).map((t) => (
          <span key={t} className={`sk ${styles.tag}`}>
            <Sketch r={10} w={1.5} c="var(--lgrey)" draw={false} />
            {t}
          </span>
        ))}
      </div>
      <div className={styles.foot}>
        <Link className={`link-btn ${styles.open}`} href={`/work/${p.id}`}>
          {HOME.readCase}
        </Link>
        <AskAbout id={p.id} className={styles.ask} />
      </div>
    </article>
  );
}
