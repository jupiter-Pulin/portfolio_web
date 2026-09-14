import Link from "next/link";
import { SITE } from "@/content/copy";
import { PROJECTS } from "@/content/projects";
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
      <div className={styles.tiles}>
        {PROJECTS.map((p) => (
          <Link className={styles.tile} key={p.id} href={`/work/${p.id}`}>
            <span className={styles.tileRole}>{p.role}</span>
            <b>{p.name}</b>
            <p>{p.short}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
