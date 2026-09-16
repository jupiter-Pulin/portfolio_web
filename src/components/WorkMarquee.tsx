"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GUIDE } from "@/content/guide";
import type { Hue } from "@/content/projects";
import { copiesFor, nextOffset } from "@/lib/marquee";
import { useAsk } from "./AskDrawer";
import styles from "./SelectedWorkStrip.module.css";

export type WorkTile = { id: string; name: string; role: string; short: string; stack: string; hue: Hue };

/**
 * The project tiles, repeated, in a row that drifts left on its own. It pauses
 * under the pointer or keyboard focus, still scrolls by hand, and with reduced
 * motion it is simply a scrollable row.
 *
 * The row is as wide as the viewport, so two copies are not always enough: the
 * drift only has `scrollWidth - clientWidth` to travel, and once that is short
 * of a copy the row stalls at its end and snaps back. It measures one copy off
 * the tiles and renders as many as that width asks for.
 */
export function WorkMarquee({ projects }: { projects: WorkTile[] }) {
  const { openAsk } = useAsk();
  const scroller = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const el = scroller.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let paused = false;
    let x = el.scrollLeft;
    let last: number | null = null;
    let frame = 0;
    // one loop: from a tile to the same tile in the next copy
    let loop = 0;
    const fit = () => {
      const boxes = el.querySelectorAll<HTMLElement>("[data-tile]");
      const next = boxes[projects.length];
      loop = next ? next.offsetLeft - boxes[0].offsetLeft : 0;
      setCopies(copiesFor(el.clientWidth, loop));
    };
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
        x = nextOffset(x, ts - last, loop);
        el.scrollLeft = x;
      }
      last = ts;
      frame = requestAnimationFrame(step);
    };
    fit();
    const sizes = new ResizeObserver(fit);
    sizes.observe(el);
    for (const ev of ["pointerenter", "pointerdown", "focusin"]) el.addEventListener(ev, pause);
    el.addEventListener("touchstart", pause, { passive: true });
    for (const ev of ["pointerleave", "focusout"]) el.addEventListener(ev, resume);
    el.addEventListener("scroll", sync, { passive: true });
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      for (const ev of ["pointerenter", "pointerdown", "focusin", "touchstart"]) el.removeEventListener(ev, pause);
      for (const ev of ["pointerleave", "focusout"]) el.removeEventListener(ev, resume);
      el.removeEventListener("scroll", sync);
    };
  }, [projects.length]);

  const tiles = (hidden: boolean) =>
    projects.map((p) => (
      <div className={styles.tile} data-tile="" key={p.id}>
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
        {Array.from({ length: copies - 1 }, (_, i) => (
          <div className={styles.clone} aria-hidden="true" key={i}>
            {tiles(true)}
          </div>
        ))}
      </div>
    </div>
  );
}
