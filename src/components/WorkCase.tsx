import Image from "next/image";
import Link from "next/link";
import { HOME, WORK } from "@/content/copy";
import { PROJECTS, type Drawn, type Project } from "@/content/projects";
import { resolveCover } from "@/lib/projectMedia";
import { detailEyebrow, projectStamps, stackTags } from "@/lib/projectMeta";
import { HUE_VAR } from "@/lib/sketchArt";
import { nextIndex } from "@/lib/workNav";
import { AskButton } from "./AskButton";
import { Icon } from "./Icon";
import { ProjectCover } from "./ProjectCover";
import { Drawing } from "./sketch/Drawing";
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
          {/* A record with "Under the hood" cards shows them further down instead of the thesis and the pair. */}
          {p.points ? null : (
            <>
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
            </>
          )}
          <Rollout project={p} />
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
      <Figures project={p} />
      <Points project={p} />
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

/** The explainer video, in the README panel's place. The README text stays in the record: the assistant still answers from it. */
function ExplainerVideo({ project: p }: { project: Project }) {
  const ex = p.explainer!;
  return (
    <figure className={styles.explainer}>
      <video
        className={styles.exVideo}
        src={ex.src}
        poster={ex.poster}
        controls
        preload="none"
        playsInline
        aria-label={`${p.name} · ${WORK.explainerLabel}`}
      />
      <figcaption className={styles.demoCaption}>{ex.caption}</figcaption>
    </figure>
  );
}

/** What can be used today, and what is built but only verified on a mainnet fork. */
function Rollout({ project: p }: { project: Project }) {
  const r = p.rollout;
  if (!r) return null;
  const row = (label: string, items: string[], color: string) => (
    <div className={styles.stack}>
      <span className={styles.stackLabel}>{label}</span>
      {items.map((t) => (
        <span key={t} className={`sk ${styles.tag}`}>
          <Sketch r={10} w={1.6} c={color} draw={false} />
          {t}
        </span>
      ))}
    </div>
  );
  return (
    <div className={styles.rollout}>
      {row(WORK.rolloutLive, r.live, "var(--mint)")}
      {row(WORK.rolloutFork, r.fork, "var(--grey)")}
    </div>
  );
}

/** A drawing made in code, in a frame, with its words in the alt text for screen readers. */
function DrawnFigure({ art, className }: { art: Drawn; className?: string }) {
  return (
    <figure className={`sk ${styles.drawnFig} ${className ?? ""}`}>
      <Sketch fill="var(--white)" r={10} w={2.4} />
      <div className={styles.drawnScroll} role="img" aria-label={art.alt}>
        <Drawing kind="case" art={art.art} className={styles.drawn} draw={120} dur={1400} />
      </div>
      <figcaption className={styles.archCaption}>{art.caption}</figcaption>
    </figure>
  );
}

/** Drawings of how the thing works, each under its own heading, full width. */
function Figures({ project: p }: { project: Project }) {
  if (!p.figures?.length) return null;
  return (
    <>
      {p.figures.map((f) => (
        <section key={f.art} className={styles.arch} aria-label={`${p.name} · ${f.title}`}>
          <div className={styles.archHead}>
            <h2 className={styles.h2}>{f.title}</h2>
          </div>
          <DrawnFigure art={f} />
        </section>
      ))}
    </>
  );
}

/** "Under the hood": one card per piece of engineering, each with its figure; the note says where the figures come from. */
function Points({ project: p }: { project: Project }) {
  if (!p.points?.length) return null;
  return (
    <section className={styles.arch} aria-label={`${p.name} · ${WORK.points}`}>
      <div className={styles.archHead}>
        <h2 className={styles.h2}>{WORK.points}</h2>
      </div>
      <dl className={styles.points}>
        {p.points.map((pt) => (
          <div key={pt.t} className={`sk ${styles.point}`}>
            <Sketch fill="var(--white)" r={12} w={2} />
            <dt>{pt.t}</dt>
            <dd>{pt.d}</dd>
            {pt.v ? (
              <dd className={styles.pointFig}>
                <b>{pt.v}</b>
                {pt.l ? <small>{pt.l}</small> : null}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
      {p.pointsNote ? <p className={`fine ${styles.pointsNote}`}>{p.pointsNote}</p> : null}
    </section>
  );
}

/** The system diagram, full width under the case: a drawing made in code, or an image that opens at full size in a new tab. */
function Architecture({ project: p }: { project: Project }) {
  const a = p.architecture;
  if (!a) return null;
  if ("art" in a) {
    return (
      <section className={styles.arch} aria-label={`${p.name} · ${WORK.architecture}`}>
        <div className={styles.archHead}>
          <h2 className={styles.h2}>{WORK.architecture}</h2>
        </div>
        <DrawnFigure art={a} />
      </section>
    );
  }
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

/** The README panel. A private project has none: its page shows the product, its drawings and the live site instead. */
function Readme({ project: p }: { project: Project }) {
  if (p.private) return null;
  return (
    <section className={`sk ${styles.readme}`}>
      <Sketch fill="var(--white)" r={14} w={2.4} />
      <div className={styles.rmHead}>
        <span className={styles.rmFile}>
          <Icon name={p.explainer ? "film" : "file"} />
          {p.explainer ? WORK.explainerFile : WORK.readmeFile}
        </span>
        <a className="chip sk" href={p.readmeUrl} target="_blank" rel="noopener">
          <Sketch r={16} w={1.8} hatch="var(--yellow)" gap={7} draw={false} />
          {WORK.openReadme}
        </a>
      </div>
      {p.explainer ? (
        <>
          {p.readmeNote ? <p className={styles.rmNote}>{p.readmeNote}</p> : null}
          <ExplainerVideo project={p} />
        </>
      ) : p.readme ? (
        <>
          {p.readmeNote ? <p className={styles.rmNote}>{p.readmeNote}</p> : null}
          <pre className={styles.rmBody}>{p.readme}</pre>
        </>
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
