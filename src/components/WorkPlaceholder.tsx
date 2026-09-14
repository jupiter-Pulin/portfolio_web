import Link from "next/link";
import { SITE } from "@/content/copy";
import { PROJECTS } from "@/content/projects";
import styles from "./WorkPlaceholder.module.css";

/** Minimal stand-in so the landing page has somewhere to link to.
    The real overview and case pages are a later task; visuals are not final. */
export function WorkPlaceholder({ project }: { project?: string }) {
  return (
    <main className={styles.placeholder}>
      <h1 className={styles.title}>{SITE.workTitle}</h1>
      {project ? <p className={styles.current}>{project}</p> : null}
      <ul className={styles.list}>
        {PROJECTS.map((p) => (
          <li key={p.id}>
            <Link href={`/work/${p.id}`}>{p.name}</Link>
          </li>
        ))}
      </ul>
      <Link className="link-btn" href="/">
        ← Back
      </Link>
    </main>
  );
}
