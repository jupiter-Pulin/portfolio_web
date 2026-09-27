import Image from "next/image";
import Link from "next/link";
import { HOME, WORK } from "@/content/copy";
import { PROJECTS, type Project } from "@/content/projects";
import { resolveCover } from "@/lib/projectMedia";
import { detailEyebrow, projectStamps, stackTags } from "@/lib/projectMeta";
import { HUE_VAR } from "@/lib/sketchArt";
import { nextIndex } from "@/lib/workNav";
import { AskButton } from "./AskButton";
import { Icon } from "./Icon";
import { ProjectCover } from "./ProjectCover";
import { Sketch } from "./sketch/Sketch";
import { WorkKeys } from "./WorkKeys";
import styles from "./WorkCase.module.css";

/** One project. Server component; the cover is read at build time. */
export function WorkCase({ project: p }: { project: Project }) {
  const total = PROJECTS.length;
  const i = PROJECTS.findIndex((x) => x.id === p.id);
  const prevHref = `/work/${PROJECTS[nextIndex(i, -1, total)].id}`;
  const nextHref = `/work/${PROJECTS[nextIndex(i, 1, total)].id}`;

  return (
    <main className={styles.page}>
      <WorkKeys prevHref={prevHref} nextHref={nextHref} />
      <nav className={styles.crumbs} aria-label={WORK.allWork}>
        <Link className="link-btn" href="/work">
          {WORK.allWork}
        </Link>
        <span className={styles.counter}>{`${p.name} · ${i + 1} of ${total}`}</span>
      </nav>

      <div className={styles.case}>
        <div className={styles.figCol}>
          {p.demo ? <Demo project={p} /> : <ProjectCover project={p} cover={resolveCover(p.id)} className={styles.fig} />}
        </div>
        <div className={styles.detail}>
          <p className="eyebrow">{detailEyebrow(p)}</p>
          <div className={styles.titleRow}>
            <h1>{p.name}</h1>
            {projectStamps(p).map((s) => (
              <span key={s} className={`sk ${styles.stamp}${s === "live" ? "" : ` ${styles.grey}`}`}>
                <Sketch r={6} w={1.8} c={s === "live" ? "var(--pink)" : "var(--grey)"} draw={false} />
                {HOME.stamps[s]}
              </span>
            ))}
          </div>
          <p className={styles.tagline}>{p.tagline}</p>
          <p className={`sk ${styles.thesis}`}>
            <Sketch r={12} w={2} c="var(--pink)" hatch={HUE_VAR[p.hue]} gap={10} hw={1.2} />
            {p.thesis}
          </p>
          <dl className={styles.pair}>
            <div className="sk">
              <Sketch fill="var(--white)" r={12} w={2} />
              <dt>{WORK.wrong}</dt>
              <dd>{p.wrong}</dd>
            </div>
            <div className="sk">
              <Sketch fill="var(--white)" r={12} w={2} />
              <dt>{WORK.mechanism}</dt>
              <dd>{p.mechanism}</dd>
            </div>
          </dl>
          <div className={styles.stack}>
            <span className={styles.stackLabel}>{WORK.stackLabel}</span>
            {stackTags(p.stack, 99).map((t) => (
              <span key={t} className={`sk ${styles.tag}`}>
                <Sketch r={10} w={1.5} c="var(--lgrey)" draw={false} />
                {t}
              </span>
            ))}
          </div>
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
          <div className={styles.acts}>
            <SiteLink project={p} />
            <ProjectAskButton id={p.id} />
          </div>
        </div>
      </div>

      <Readme project={p} />
      <Architecture project={p} />

      <nav className={styles.foot} aria-label={WORK.allWork}>
        <Link className="btn sk sm" href={prevHref}>
          <Sketch r={16} w={2} draw={false} />
          {WORK.prev}
        </Link>
        <span className={styles.counter}>{`${i + 1} / ${total}`}</span>
        <Link className="btn sk sm" href={nextHref}>
          <Sketch r={16} w={2} draw={false} />
          {WORK.next}
        </Link>
      </nav>
    </main>
  );
}

/** The walkthrough, in the cover's place. Nothing loads until the visitor presses play. */
function Demo({ project: p }: { project: Project }) {
  const demo = p.demo!;
  return (
    <figure className={`sk ${styles.fig} ${styles.demo}`}>
      <Sketch fill="var(--white)" r={8} w={2.4} />
      <video
        className={styles.video}
        src={demo.src}
        poster={demo.poster}
        controls
        preload="none"
        playsInline
        aria-label={`${p.name} · ${WORK.demoLabel}`}
      />
      <figcaption className={styles.demoCaption}>{demo.caption}</figcaption>
    </figure>
  );
}

/** The system diagram, full width under the case, opening at full size in a new tab. */
function Architecture({ project: p }: { project: Project }) {
  const a = p.architecture;
  if (!a) return null;
  return (
    <section className={styles.arch} aria-label={`${p.name} · ${WORK.architecture}`}>
      <div className={styles.archHead}>
        <h2 className={styles.h2}>{WORK.architecture}</h2>
        <a className="chip sk" href={a.src} target="_blank" rel="noopener">
          <Sketch r={16} w={1.8} hatch="var(--yellow)" gap={7} draw={false} />
          {WORK.openFullSize}
        </a>
      </div>
      <figure className={`sk ${styles.archFig}`}>
        <Sketch fill="var(--white)" r={10} w={2.4} />
        <Image className={styles.archImg} src={a.src} alt={a.alt} width={a.width} height={a.height} unoptimized />
        <figcaption className={styles.archCaption}>{a.caption}</figcaption>
      </figure>
    </section>
  );
}

/** The running product, for any project that has one — private ones included. */
const SiteLink = ({ project: p }: { project: Project }) =>
  p.site ? (
    <a className="btn btn-ink sk sm" href={p.site.url} target="_blank" rel="noopener">
      <Sketch fill="var(--ink)" r={16} draw={false} />
      <Icon name="rocket" className="ic" />
      {`${WORK.visitSite} ${p.site.label} ↗`}
    </a>
  ) : null;

/** The assistant, opened already scoped to this project. */
const ProjectAskButton = ({ id }: { id: string }) => (
  <AskButton className="chip sk amber" label={WORK.askProject} scopeId={id} sketch={{ r: 16, w: 1.8, c: "var(--pink)", draw: false }} />
);

function Readme({ project: p }: { project: Project }) {
  if (p.private) {
    return (
      <section className={`sk ${styles.readme}`}>
        <Sketch fill="var(--white)" r={14} w={2.4} />
        <div className={styles.rmHead}>
          <span className={styles.rmFile}>
            <Icon name="lock" />
            {WORK.privateRepo}
          </span>
        </div>
        <div className={styles.plain}>
          <p>{p.scope}</p>
        </div>
        {p.readme ? (
          <>
            <p className={styles.rmNote}>{WORK.privateNotes}</p>
            <pre className={`${styles.rmBody} ${styles.notes}`}>{p.readme}</pre>
          </>
        ) : null}
      </section>
    );
  }
  return (
    <section className={`sk ${styles.readme}`}>
      <Sketch fill="var(--white)" r={14} w={2.4} />
      <div className={styles.rmHead}>
        <span className={styles.rmFile}>
          <Icon name="file" />
          {WORK.readmeFile}
        </span>
        <a className="chip sk" href={p.readmeUrl} target="_blank" rel="noopener">
          <Sketch r={16} w={1.8} hatch="var(--yellow)" gap={7} draw={false} />
          {WORK.openReadme}
        </a>
      </div>
      {p.readme && p.readmeNote ? <p className={styles.rmNote}>{p.readmeNote}</p> : null}
      {p.readme ? (
        <pre className={styles.rmBody}>{p.readme}</pre>
      ) : (
        <div className={styles.plain}>
          <p>{p.readmeNote}</p>
        </div>
      )}
      <div className={styles.rmFoot}>
        {p.repos.map((r) => (
          <a className="chip sk" key={r.url} href={r.url} target="_blank" rel="noopener">
            <Sketch r={16} w={1.8} hatch="var(--yellow)" gap={7} draw={false} />
            <Icon name="github" className="ic" />
            {`${r.label} ↗`}
          </a>
        ))}
      </div>
    </section>
  );
}
