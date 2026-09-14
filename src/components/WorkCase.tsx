import Link from "next/link";
import { WORK } from "@/content/copy";
import { PROJECTS, type Project } from "@/content/projects";
import { resolveCover } from "@/lib/projectMedia";
import { detailEyebrow } from "@/lib/projectMeta";
import { nextIndex } from "@/lib/workNav";
import { AskButton } from "./AskButton";
import { Icon } from "./Icon";
import { ProjectCover } from "./ProjectCover";
import { WorkKeys } from "./WorkKeys";
import { WorkFoot, WorkShell } from "./WorkShell";
import styles from "./WorkCase.module.css";

/** One project — design/mock caseHTML(). Server component; the cover is read at build time. */
export function WorkCase({ project: p }: { project: Project }) {
  const total = PROJECTS.length;
  const i = PROJECTS.findIndex((x) => x.id === p.id);
  const prevHref = `/work/${PROJECTS[nextIndex(i, -1, total)].id}`;
  const nextHref = `/work/${PROJECTS[nextIndex(i, 1, total)].id}`;

  return (
    <WorkShell
      subtitle={`${p.name} · ${i + 1} of ${total}`}
      titleAs="p"
      back={
        <Link className="btn btn-ghost sm" href="/work">
          {WORK.allWork}
        </Link>
      }
      foot={<WorkFoot prevHref={prevHref} nextHref={nextHref} counter={`${i + 1} / ${total}`} />}
    >
      <WorkKeys prevHref={prevHref} nextHref={nextHref} />
      <div className={styles.case}>
        <ProjectCover project={p} cover={resolveCover(p.id)} className={styles.fig} />
        <div className={styles.detail}>
          <p className="eyebrow">{detailEyebrow(p)}</p>
          <h1>{p.name}</h1>
          <p className={styles.tagline}>{p.tagline}</p>
          <p className={styles.thesis}>{p.thesis}</p>
          <dl className={styles.pair}>
            <div>
              <dt>{WORK.wrong}</dt>
              <dd>{p.wrong}</dd>
            </div>
            <div>
              <dt>{WORK.mechanism}</dt>
              <dd>{p.mechanism}</dd>
            </div>
          </dl>
          <p className={styles.stack}>
            <span>{WORK.stackLabel}</span>
            {p.stack}
          </p>
          {p.stats.length > 0 ? (
            <>
              <div className={styles.stats}>
                {p.stats.map((s) => (
                  <div key={s.l}>
                    <b>{s.v}</b>
                    <small>{s.l}</small>
                  </div>
                ))}
              </div>
              {p.statsNote ? <p className={`fine ${styles.statsNote}`}>{p.statsNote}</p> : null}
            </>
          ) : null}
          <Readme project={p} />
        </div>
      </div>
    </WorkShell>
  );
}

/** The guide, opened already scoped to this project. */
const ProjectAskButton = ({ id }: { id: string }) => (
  <AskButton className="chip amber" label={WORK.askProject} scopeId={id} />
);

function Readme({ project: p }: { project: Project }) {
  if (p.private) {
    return (
      <div className={styles.readme}>
        <div className={styles.rmHead}>
          <span className={styles.rmFile}>
            <Icon name="lock" />
            {WORK.privateRepo}
          </span>
          <ProjectAskButton id={p.id} />
        </div>
        <div className={`${styles.rmBody} ${styles.plain}`}>
          <p>{p.scope}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.readme}>
      <div className={styles.rmHead}>
        <span className={styles.rmFile}>
          <Icon name="file" />
          {WORK.readmeFile}
        </span>
        <div className={styles.rmBtns}>
          <ProjectAskButton id={p.id} />
          <a className="chip" href={p.readmeUrl} target="_blank" rel="noopener">
            {WORK.openReadme}
          </a>
        </div>
      </div>
      {p.readme && p.readmeNote ? <p className={styles.rmNote}>{p.readmeNote}</p> : null}
      {p.readme ? (
        <pre className={styles.rmBody}>{p.readme}</pre>
      ) : (
        <div className={`${styles.rmBody} ${styles.plain}`}>
          <p>{p.readmeNote}</p>
        </div>
      )}
      <div className={styles.rmFoot}>
        {p.repos.map((r) => (
          <a
            className="btn btn-ghost sm"
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noopener"
          >
            <Icon name="github" className="ic" />
            {`${r.label} ↗`}
          </a>
        ))}
      </div>
    </div>
  );
}
