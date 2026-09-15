import Link from "next/link";
import { SITE } from "@/content/copy";
import { PROJECTS } from "@/content/projects";
import { WorkMarquee } from "./WorkMarquee";
import styles from "./SelectedWorkStrip.module.css";

export function SelectedWorkStrip() {
  return (
    <section className={styles.strip} aria-labelledby="strip-title">
      <div className={styles.stripHead}>
        <h2 id="strip-title" className="eyebrow">
          {SITE.stripTitle}
        </h2>
        <Link className="link-btn" href="/work">
          {SITE.stripOpenAll}
        </Link>
      </div>
      <WorkMarquee
        projects={PROJECTS.map(({ id, name, role, short, stack, hue }) => ({ id, name, role, short, stack, hue }))}
      />
    </section>
  );
}
