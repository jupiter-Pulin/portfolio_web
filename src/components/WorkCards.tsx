import Link from "next/link";
import { HOME, SITE } from "@/content/copy";
import { PROJECTS } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import { Wavy } from "./sketch/Wavy";
import styles from "./Sections.module.css";

/** "Things I've built" on the home page: every project on a card, the first one wide. */
export function WorkCards() {
  return (
    <section className={styles.block} id="work" aria-labelledby="work-title">
      <div className={styles.head}>
        <h2 id="work-title" className={styles.title}>
          {HOME.workTitle} <Wavy>{HOME.workAccent}</Wavy>
        </h2>
        <p className={styles.sub}>{SITE.workSubtitle}</p>
        <Link className={`link-btn ${styles.more}`} href="/work">
          {SITE.stripOpenAll}
        </Link>
      </div>
      <div className={styles.cards}>
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} featured={i === 0} />
        ))}
      </div>
    </section>
  );
}
