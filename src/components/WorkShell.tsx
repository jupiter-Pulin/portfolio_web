import type { ReactNode } from "react";
import Link from "next/link";
import { SITE, WORK } from "@/content/copy";
import { Icon } from "./Icon";
import styles from "./WorkShell.module.css";

/** The full-screen dark layer both /work views live in. */
export function WorkShell({
  subtitle,
  back,
  foot,
  // On a case page the project name is the <h1>, so the section title steps down.
  titleAs: Title = "h1",
  children,
}: {
  subtitle: string;
  back?: ReactNode;
  foot?: ReactNode;
  titleAs?: "h1" | "p";
  children: ReactNode;
}) {
  return (
    <main className={styles.overlay}>
      <div className={styles.ovHead}>
        {back}
        <div className={styles.ovTitle}>
          <Title className={styles.t}>{SITE.workTitle}</Title>
          <p className={styles.sub}>{subtitle}</p>
        </div>
        <Link className="icon-btn" href="/" aria-label={WORK.close}>
          <Icon name="close" />
        </Link>
      </div>
      <div className={styles.ovBody}>{children}</div>
      {foot}
    </main>
  );
}

/** Previous / counter / next, wrapping at both ends. */
export function WorkFoot({
  prevHref,
  nextHref,
  counter,
}: {
  prevHref: string;
  nextHref: string;
  counter: string;
}) {
  return (
    <div className={styles.ovFoot}>
      <Link className="btn btn-ghost sm" href={prevHref}>
        {WORK.prev}
      </Link>
      <span className={styles.counter}>{counter}</span>
      <Link className="btn btn-ghost sm" href={nextHref}>
        {WORK.next}
      </Link>
    </div>
  );
}
