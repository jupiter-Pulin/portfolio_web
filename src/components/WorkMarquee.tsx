"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { GUIDE } from "@/content/guide";
import type { Hue } from "@/content/projects";
import { nextOffset } from "@/lib/marquee";
import { useAsk } from "./AskDrawer";
import styles from "./SelectedWorkStrip.module.css";

export type WorkTile = { id: string; name: string; role: string; short: string; stack: string; hue: Hue };

/**
 * The project tiles, twice over, in a row that drifts left on its own. It
 * pauses under the pointer or keyboard focus, still scrolls by hand, and with
 * reduced motion it is simply a scrollable row.
 */
export function WorkMarquee({ projects }: { projects: WorkTile[] }) {
  const { openAsk } = useAsk();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let paused = false;
    let x = el.scrollLeft;
    let last: number | null = null;
    let frame = 0;
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
      x = el.scrollLeft;
    };
    const sync = () => {
      if (paused) x = el.scrollLeft;
    };
    const step = (ts: number) => {
      if (last !== null && !paused) {
        x = nextOffset(x, ts - last, el.scrollWidth / 2);
        el.scrollLeft = x;
      }
      last = ts;
      frame = requestAnimationFrame(step);
    };
    for (const ev of ["pointerenter", "pointerdown", "focusin"]) el.addEventListener(ev, pause);
    el.addEventListener("touchstart", pause, { passive: true });
    for (const ev of ["pointerleave", "focusout"]) el.addEventListener(ev, resume);
    el.addEventListener("scroll", sync, { passive: true });
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      for (const ev of ["pointerenter", "pointerdown", "focusin", "touchstart"]) el.removeEventListener(ev, pause);
      for (const ev of ["pointerleave", "focusout"]) el.removeEventListener(ev, resume);
      el.removeEventListener("scroll", sync);
    };
  }, []);

  const tiles = (hidden: boolean) =>
    projects.map((p) => (
      <div className={styles.tile} key={p.id}>
        <Link className={styles.tileLink} href={`/work/${p.id}`} tabIndex={hidden ? -1 : undefined}>
          <span className={styles.tileRole}>{p.role}</span>
          <b>
            <i className={`${styles.dot} ${styles[p.hue]}`} />
            {p.name}
          </b>
          <p>{p.short}</p>
          <span className={styles.tileStack}>{p.stack}</span>
        </Link>
        <button className={styles.tileAsk} type="button" tabIndex={hidden ? -1 : undefined} onClick={() => openAsk(p.id)}>
          {GUIDE.hero.askProject}
        </button>
      </div>
    ));

  return (
    <div className={styles.tiles} ref={scroller}>
      <div className={styles.track}>
        {tiles(false)}
        <div className={styles.clone} aria-hidden="true">
          {tiles(true)}
        </div>
      </div>
    </div>
  );
}
