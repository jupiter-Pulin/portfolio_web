import Image from "next/image";
import { HOME, IDENTITY, SITE } from "@/content/copy";
import { MAILTO } from "@/content/links";
import { splitRole } from "@/lib/projectMeta";
import { CopyEmailButton } from "./CopyEmailButton";
import { Icon } from "./Icon";
import { Drawing } from "./sketch/Drawing";
import { Sketch } from "./sketch/Sketch";
import { Wavy } from "./sketch/Wavy";
import styles from "./IdentityCard.module.css";

/** Who Nolan is, at a glance: a taped photo, the name, what he is after, how to hire him. */
export function IdentityCard() {
  const [lead, accent] = splitRole(IDENTITY.role);
  return (
    <aside className={styles.me} aria-label={SITE.name}>
      <div className={`sk rise ${styles.polaroid}`} style={{ "--d": "80ms" } as React.CSSProperties}>
        <Sketch fill="var(--white)" r={6} w={2.4} />
        <Drawing kind="tape" className={styles.tape} />
        <Image className={styles.photo} src="/avatar.jpg" alt={IDENTITY.avatarAlt} width={168} height={168} unoptimized priority />
        <span className={styles.cap}>{HOME.polaroidCaption}</span>
      </div>
      <p className={`anno ${styles.thatsMe}`} aria-hidden="true">
        {HOME.thatsMe}
        <Drawing kind="arrow" w={60} h={40} pts={[56, 6, 30, -4, 6, 26]} className={styles.arrow} draw={1300} dur={400} />
      </p>
      <div className={`rise ${styles.who}`} style={{ "--d": "160ms" } as React.CSSProperties}>
        <h1 className={styles.name}>{SITE.name}</h1>
        <p className={styles.role}>
          {lead}
          {accent ? (
            <>
              {" · "}
              <Wavy>{accent}</Wavy>
            </>
          ) : null}
        </p>
        <span className={`sk ${styles.status}`}>
          <Sketch r={20} w={2} />
          <i className="dot" />
          {IDENTITY.status}
        </span>
      </div>
      <dl className={`sk rise ${styles.facts}`} style={{ "--d": "260ms" } as React.CSSProperties}>
        <Sketch fill="var(--white)" r={14} w={2.4} />
        {IDENTITY.facts.map((f) => (
          <div className={styles.fact} key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.text}</dd>
          </div>
        ))}
      </dl>
      <div className={`rise ${styles.foot}`} style={{ "--d": "340ms" } as React.CSSProperties}>
        <a className="btn btn-ink sk" href={MAILTO}>
          <Sketch fill="var(--ink)" r={22} />
          <Icon name="mail" className="ic" />
          {IDENTITY.ctaHire}
        </a>
        <CopyEmailButton label={IDENTITY.ctaCopy} />
      </div>
    </aside>
  );
}
