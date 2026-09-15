import Link from "next/link";
import { SITE, WORK } from "@/content/copy";
import { PROJECTS, type Project } from "@/content/projects";
import { resolveCover } from "@/lib/projectMedia";
import { statusBadge } from "@/lib/projectMeta";
import { Icon } from "./Icon";
import { ProjectCover } from "./ProjectCover";
import { WorkShell } from "./WorkShell";
import styles from "./WorkGallery.module.css";

/**
 * The overview grid. The whole card is clickable via
 * a stretched "Learn more" link; the README link sits above it, so no <a> nests.
 * Server component: resolveCover() reads the filesystem at build time.
 */
export function WorkGallery() {
  return (
    <WorkShell subtitle={SITE.workSubtitle}>
      <div className={styles.gallery}>
        {PROJECTS.map((p, i) => (
          <Card key={p.id} project={p} featured={i === 0} />
        ))}
      </div>
    </WorkShell>
  );
}

function Card({ project: p, featured }: { project: Project; featured: boolean }) {
  const badge = statusBadge(p);
  return (
    <article className={`${styles.gcard} ${featured ? styles.featured : ""}`}>
      <ProjectCover project={p} cover={resolveCover(p.id)} className={styles.gimg} />
      <div className={styles.gtext}>
        <p className="eyebrow">
          {p.role}
          {badge ? <span className={styles.badge}>{badge}</span> : null}
        </p>
        <h2>{p.name}</h2>
        <p className={styles.gshort}>{p.short}</p>
        {featured ? <p className={styles.gtag}>{p.tagline}</p> : null}
        <div className={styles.gactions}>
          <Link className={`btn btn-primary sm ${styles.stretch}`} href={`/work/${p.id}`}>
            {WORK.learnMore}
          </Link>
          {p.private ? (
            // Not raised above the stretched link: a private project has nowhere
            // else to go, so the whole card — chip included — opens the case page.
            <span className="chip static">
              <Icon name="lock" className="ic" />
              {WORK.privateRepo}
            </span>
          ) : (
            <a
              className={`chip ${styles.above}`}
              href={p.readmeUrl}
              target="_blank"
              rel="noopener"
            >
              {WORK.readmeLink}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
