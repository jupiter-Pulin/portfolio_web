import { HOME } from "@/content/copy";
import { PROJECTS } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import { Wavy } from "./sketch/Wavy";
import styles from "./Sections.module.css";

/** Every project on a card, the first one wide — the same cards as the home page. */
export function WorkGallery() {
  return (
    <section className={styles.block} aria-labelledby="work-title">
      <div className={styles.head}>
        <h1 id="work-title" className={styles.title}>
          {HOME.workTitle} <Wavy>{HOME.workAccent}</Wavy>
        </h1>
      </div>
      <div className={styles.cards}>
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} featured={i === 0} heading="h2" />
        ))}
      </div>
    </section>
  );
}
