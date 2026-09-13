"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { HERO, HOW_I_BUILD } from "@/content/copy";
import { doneCountAt, lineDelay } from "@/lib/buildLog";
import {
  PINNED_TRANSFORM,
  RESET_TRANSFORM,
  canTilt,
  glarePosition,
  pointerOffset,
  tiltTransform,
} from "@/lib/tilt";
import { Icon, type IconName } from "./Icon";
import styles from "./HowIBuildCard.module.css";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const LINES = HOW_I_BUILD.terminal.lines;

const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const reducedMotionNow = () => window.matchMedia(REDUCED_MOTION).matches;
const reducedMotionOnServer = () => false;

export function HowIBuildCard() {
  const stage = useRef<HTMLDivElement>(null);
  const win = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);
  const [ticked, setTicked] = useState(0);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionNow,
    reducedMotionOnServer,
  );
  // Reduced motion shows the checklist finished; otherwise it ticks over after mount.
  const done = reduced ? doneCountAt(0, LINES.length, true) : ticked;

  useEffect(() => {
    if (reduced) return;
    const timers = LINES.map((_, i) =>
      setTimeout(() => setTicked((n) => Math.max(n, i + 1)), lineDelay(i)),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const card = win.current;
    const box = stage.current;
    if (!card || !box) return;
    if (!canTilt({ reduced, pinned, pointerType: e.pointerType })) return;
    const offset = pointerOffset(box.getBoundingClientRect(), e.clientX, e.clientY);
    const { gx, gy } = glarePosition(offset);
    card.style.transition = "box-shadow .3s";
    card.style.transform = tiltTransform(offset);
    card.style.setProperty("--gx", gx);
    card.style.setProperty("--gy", gy);
  };

  const onPointerLeave = () => {
    const card = win.current;
    if (!card || pinned) return;
    card.style.transition = "";
    card.style.transform = RESET_TRANSFORM;
  };

  const onCardClick = (e: MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    const card = win.current;
    const next = !pinned;
    setPinned(next);
    if (card) {
      card.style.transition = "";
      card.style.transform = next ? PINNED_TRANSFORM : RESET_TRANSFORM;
    }
  };

  return (
    <div
      className={styles.stage}
      ref={stage}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <article
        className={`${styles.win}${pinned ? " pinned" : ""}`}
        ref={win}
        aria-label="How I build"
        onClick={onCardClick}
      >
        <div className={styles.winBar}>
          <span className={styles.dots}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.flow}>{HOW_I_BUILD.flow}</span>
          <span className={styles.live}>
            <i />
            {HOW_I_BUILD.live}
          </span>
        </div>
        <h2 className={styles.winTitle}>{HOW_I_BUILD.title}</h2>
        <p className={styles.winSub}>{HOW_I_BUILD.subtitle}</p>
        <ol className={styles.steps}>
          {HOW_I_BUILD.steps.map((step) => (
            <li key={step.n} className={step.n === HOW_I_BUILD.activeStep ? styles.active : ""}>
              <span className={styles.stepIc}>
                <Icon name={step.icon as IconName} />
              </span>
              <b>
                {step.n}. {step.name}
              </b>
              <small>{step.desc}</small>
            </li>
          ))}
        </ol>
        <div className={styles.winBottom}>
          <div className={styles.term} aria-label="Build log">
            <div className={styles.prompt}>{HOW_I_BUILD.terminal.prompt}</div>
            {LINES.map((line, i) => (
              <div
                key={line}
                className={`${styles.tline}${i < done ? ` ${styles.done}` : ""}`}
                data-done={i < done}
              >
                <span className={styles.chk}>
                  <Icon name="check" />
                </span>
                {line}
              </div>
            ))}
            <div className={`${styles.tline} ${styles.ship}`}>
              <span className={styles.spin} aria-hidden="true" />
              {HOW_I_BUILD.terminal.shipping}
            </div>
          </div>
          <div className={styles.shipPanel}>
            <div className={styles.shipTop}>
              <span className={styles.rocket}>
                <Icon name="rocket" />
              </span>
              <div>
                <b>{HOW_I_BUILD.ship.title}</b>
                <p>{HOW_I_BUILD.ship.text}</p>
              </div>
            </div>
            <div className={styles.shipStats}>
              {HOW_I_BUILD.ship.stats.map((stat) => (
                <div key={stat.l}>
                  <b>{stat.v}</b>
                  <small>{stat.l}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
      <p className={styles.stageHint}>{pinned ? HERO.tiltPinned : HERO.tiltHint}</p>
    </div>
  );
}
