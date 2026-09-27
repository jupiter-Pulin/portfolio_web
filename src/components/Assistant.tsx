"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { GUIDE } from "@/content/guide";
import { projectById } from "@/content/projects";
import { hasAsked, isPending } from "@/lib/askClient";
import { circleAround } from "@/lib/circleAround";
import { clamp } from "@/lib/sketch";
import { buildRobot, ROBOT_VIEWBOX } from "@/lib/sketchArt";
import { Starters, Thread, loadHandFontCJK, useAsk, type Go } from "./AskDrawer";
import { Icon } from "./Icon";
import { Drawing } from "./sketch/Drawing";
import { Rule } from "./sketch/Rule";
import { Sketch } from "./sketch/Sketch";
import { Wavy } from "./sketch/Wavy";
import styles from "./Assistant.module.css";

type Mood = "" | "walking" | "landing" | "waving" | "talking" | "jumping";
type Line = { hi: string; q: string; cta: string };
type Place = { left: number; top: number; width: number; tx: number };

// The walk-in plays once a session; coming back to the home page, the robot is simply there.
const WALKED = "assistant-walked";
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Nolan's assistant on the home page. It walks in from the right, waves and says
 * hello in a small bubble — no chat box yet. Clicking it (or the bubble, the
 * header button, a card's "ask about it") opens the chat; "hide chat" sends it
 * back. The robot is one drawing that hops between the two places (FLIP). The
 * conversation itself lives in AskProvider, shared with the drawer.
 */
export function Assistant() {
  const ask = useAsk();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<Mood>("");
  const [line, setLine] = useState<Line | null>(null);
  const [typed, setTyped] = useState(0);
  const [place, setPlace] = useState<Place | null>(null);
  const [draft, setDraft] = useState("");
  const [example, setExample] = useState<string>(GUIDE.placeholder);

  const robot = useRef<SVGSVGElement | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLButtonElement>(null);
  const flow = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);
  const flipFrom = useRef<DOMRect | null>(null);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const moodFor = useCallback(
    (m: Mood, ms: number) => {
      setMood(m);
      later(() => setMood((cur) => (cur === m ? "" : cur)), ms);
    },
    [later],
  );

  // The drawing is built whenever its <svg> mounts — on the stage or in the chat.
  const robotRef = useCallback((svg: SVGSVGElement | null) => {
    robot.current = svg;
    if (svg && !svg.firstChild) buildRobot(svg);
  }, []);

  const look = (dx: number) => robot.current?.querySelector(".rb-eyes-look")?.setAttribute("transform", `translate(${dx} 0)`);

  /** Say a line in the bubble. */
  const arrive = useCallback(
    (words: Line, delay: number) => {
      later(() => {
        look(0);
        moodFor("waving", 1700);
        // Reduced motion shows the whole line at once.
        setTyped(still() ? Number.MAX_SAFE_INTEGER : 0);
        setLine(words);
      }, delay);
    },
    [later, moodFor],
  );

  // The bubble sits above the robot, its tail reaching down towards the head.
  const placeBubble = useCallback(() => {
    const st = stage.current, rb = robot.current, b = bubble.current;
    if (!st || !rb || !b || openRef.current) return;
    const s = st.getBoundingClientRect(), r = rb.getBoundingClientRect();
    const width = Math.min(430, s.width - 16);
    b.style.width = `${width}px`;
    const h = b.offsetHeight;
    const hx = r.left - s.left + r.width * 0.2;
    const left = clamp(hx - 0.9 * width, 0, Math.max(0, s.width - width));
    const tx = Math.round(clamp((hx - left) / width, 0.2, 0.92) * 50) / 50;
    setPlace({ left, top: Math.max(0, r.top - s.top - 6 - h), width, tx });
  }, []);

  useLayoutEffect(() => {
    if (line) placeBubble();
  }, [line, placeBubble]);

  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const ro = new ResizeObserver(() => line && placeBubble());
    ro.observe(st);
    return () => ro.disconnect();
  }, [open, line, placeBubble]);

  // Type the bubble's words in; the rest of the line is already there, invisible, so nothing jumps.
  useEffect(() => {
    if (!line || still()) return;
    const total = Array.from(line.hi + line.q).length;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setTyped(n);
      if (n >= total) window.clearInterval(id);
    }, 34);
    return () => window.clearInterval(id);
  }, [line]);

  // The walk-in, once per session. A layout effect, so the first frame painted is
  // already the first frame of the walk.
  useLayoutEffect(() => {
    const svg = robot.current;
    const st = stage.current;
    if (!svg || !st) return;
    let walked = false;
    try {
      walked = sessionStorage.getItem(WALKED) === "1";
    } catch {
      // storage blocked: walk in every time
    }
    if (still() || walked) {
      arrive(GUIDE.hero.welcome, 300);
      return;
    }
    const r = svg.getBoundingClientRect();
    const dx = window.innerWidth - r.left + 40;
    setMood("walking");
    look(-9);
    const walk = svg.animate([{ transform: `translateX(${dx}px) scale(0.84)` }, { transform: "none" }], {
      duration: clamp(dx * 3.4, 1500, 2600),
      easing: "cubic-bezier(.3,.25,.35,1)",
    });
    const dust = window.setInterval(() => {
      const s = st.getBoundingClientRect(), b = svg.getBoundingClientRect();
      const puff = document.createElement("i");
      puff.className = styles.puff;
      puff.style.left = `${b.right - s.left - b.width * 0.32}px`;
      puff.style.top = `${b.bottom - s.top - 16}px`;
      st.append(puff);
      window.setTimeout(() => puff.remove(), 720);
    }, 200);
    walk.onfinish = () => {
      window.clearInterval(dust);
      try {
        sessionStorage.setItem(WALKED, "1");
      } catch {
        // fine
      }
      setMood("landing");
      later(() => setMood((cur) => (cur === "landing" ? "" : cur)), 460);
      arrive(GUIDE.hero.welcome, 280);
    };
    return () => {
      window.clearInterval(dust);
      walk.cancel();
    };
    // The walk runs once, when the stage first mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openChat = useCallback(() => {
    loadHandFontCJK();
    if (openRef.current) {
      input.current?.focus({ preventScroll: true });
      return;
    }
    flipFrom.current = robot.current?.getBoundingClientRect() ?? null;
    openRef.current = true;
    setLine(null);
    setOpen(true);
    moodFor("talking", 800);
  }, [moodFor]);

  /** A click on the robot: a little jump, then the chat. */
  const jumpThenOpen = useCallback(() => {
    if (still()) return openChat();
    moodFor("jumping", 560);
    later(openChat, 380);
  }, [later, moodFor, openChat]);

  const closeChat = useCallback(() => {
    flipFrom.current = robot.current?.getBoundingClientRect() ?? null;
    openRef.current = false;
    setOpen(false);
  }, []);

  // The robot hops from where it was to where it is now, with a little arc.
  useLayoutEffect(() => {
    const from = flipFrom.current;
    const svg = robot.current;
    if (!from || !svg) return;
    flipFrom.current = null;
    const to = svg.getBoundingClientRect();
    if (!still() && from.width && to.width) {
      const dx = from.left - to.left, dy = from.top - to.top, k = from.width / to.width;
      svg.animate(
        [
          { transformOrigin: "0 0", transform: `translate(${dx}px, ${dy}px) scale(${k})` },
          { transformOrigin: "0 0", transform: `translate(${dx / 2}px, ${dy / 2 - 46}px) scale(${(k + 1) / 2})`, offset: 0.5 },
          { transformOrigin: "0 0", transform: "none" },
        ],
        { duration: 680, easing: "cubic-bezier(.35,.1,.3,1)" },
      );
    }
    if (open) {
      input.current?.focus({ preventScroll: true });
      const top = root.current?.getBoundingClientRect().top ?? 0;
      if (top < 60 || top > window.innerHeight * 0.45) root.current?.scrollIntoView({ behavior: still() ? "auto" : "smooth", block: "start" });
    } else {
      arrive(GUIDE.hero.back, 420);
    }
  }, [open, arrive]);

  // The header button and "ask about it" land here while the assistant is on the page.
  const { registerInline } = ask;
  useEffect(() => {
    registerInline({
      focus: () => {
        root.current?.scrollIntoView({ behavior: still() ? "auto" : "smooth", block: "start" });
        openChat();
      },
    });
    return () => registerInline(null);
  }, [registerInline, openChat]);

  // The theme toggle waves hello too.
  useEffect(() => {
    const wave = () => moodFor("waving", 1400);
    window.addEventListener("assistant:wave", wave);
    return () => window.removeEventListener("assistant:wave", wave);
  }, [moodFor]);

  // The eyes follow the pointer a little.
  useEffect(() => {
    if (still()) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const svg = robot.current;
        if (!svg || svg.classList.contains("walking")) return;
        const b = svg.getBoundingClientRect();
        const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height * 0.36);
        const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 400);
        svg.querySelector(".rb-eyes-look")?.setAttribute("transform", `translate(${((dx / d) * 9 * k).toFixed(1)} ${((dy / d) * 6 * k).toFixed(1)})`);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  // A reply lands: the robot talks for a moment.
  const pending = isPending(ask.msgs);
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) moodFor("talking", 1200);
    wasPending.current = pending;
  }, [pending, moodFor]);

  // Keep the newest line in view, above the composer that floats at the bottom.
  const shown = useRef(ask.msgs);
  useEffect(() => {
    const prev = shown.current;
    shown.current = ask.msgs;
    if (!open || prev === ask.msgs) return;
    const last = flow.current?.lastElementChild as HTMLElement | null;
    const rows = flow.current?.querySelectorAll<HTMLElement>("[data-msg]");
    const newest = rows?.[rows.length - 1];
    const form = composer.current;
    if (!last || !newest || !form) return;
    window.requestAnimationFrame(() => {
      const end = last.getBoundingClientRect().bottom, limit = form.getBoundingClientRect().top - 20;
      if (end <= limit) return;
      // Show the end of the thread, but never scroll the newest line's start under the header.
      const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--head")) || 72;
      const by = Math.min(end - limit, newest.getBoundingClientRect().top - head - 16);
      if (by > 0) window.scrollBy({ top: by, behavior: still() ? "auto" : "smooth" });
    });
  }, [ask.msgs, open]);

  // The placeholder types example questions while the composer waits.
  useEffect(() => {
    if (!open || still()) return;
    let i = 0, n = 0, id = 0;
    const next = () => {
      const el = input.current;
      if (el && (document.activeElement === el || el.value)) {
        id = window.setTimeout(next, 3000);
        return;
      }
      const s = GUIDE.examples[i % GUIDE.examples.length];
      n += 1;
      setExample(s.slice(0, n));
      if (n < s.length) id = window.setTimeout(next, 28);
      else {
        i += 1;
        n = 0;
        id = window.setTimeout(next, 2600);
      }
    };
    id = window.setTimeout(next, 4200);
    return () => window.clearTimeout(id);
  }, [open]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const typedQ = draft.trim();
    // One question at a time: while the assistant is answering, the draft stays put.
    if (!typedQ || pending) return;
    setDraft("");
    ask.onAsk(typedQ);
  };

  const go: Go = {
    open: ask.openProject,
    nav: ask.navigate,
    show: (id) => {
      const card = document.getElementById(`card-${id}`);
      if (card) circleAround(card, GUIDE.hero.here);
    },
  };
  const scope = ask.scopeId ? projectById(ask.scopeId) : undefined;
  const robotClass = `robot ${open && pending ? "thinking" : mood}`;
  const words = line ?? GUIDE.hero.welcome;
  const hi = Array.from(words.hi), q = Array.from(words.q);
  const asked = hasAsked(ask.msgs);

  return (
    <div className={styles.assistant} data-state={open ? "chat" : "idle"} ref={root} id="assistant">
      {!open ? (
        <div className={styles.stage} ref={stage}>
          <button
            ref={bubble}
            type="button"
            className={`sk ${styles.welcome}${line ? ` ${styles.shown}` : ""}${line && typed >= hi.length + q.length ? ` ${styles.typed}` : ""}`}
            style={place ? ({ left: place.left, top: place.top, width: place.width, "--ox": `${Math.round(place.tx * place.width)}px` } as CSSProperties) : undefined}
            onClick={openChat}
            tabIndex={line ? 0 : -1}
            aria-hidden={line ? undefined : true}
          >
            <Sketch shape="down" tx={place?.tx ?? 0.8} fill="var(--white)" c="var(--bubble)" w={2.6} draw={false} />
            <span className={styles.wHi}>
              {hi.slice(0, typed).join("")}
              <span className={styles.ghost}>{hi.slice(typed).join("")}</span>
            </span>
            <span className={styles.wQ}>
              {q.slice(0, Math.max(0, typed - hi.length)).join("")}
              <span className={styles.ghost}>{q.slice(Math.max(0, typed - hi.length)).join("")}</span>
            </span>
            <span className={styles.wCta}>{words.cta}</span>
          </button>
          <button type="button" className={styles.spot} onClick={jumpThenOpen} aria-label={GUIDE.hero.robotLabel}>
            <svg ref={robotRef} className={robotClass} viewBox={ROBOT_VIEWBOX} aria-hidden="true" focusable="false" />
          </button>
          <Rule className={styles.ground} seed={9} />
          <p className={styles.cap}>
            <i className={`dot${ask.available ? "" : " off"}`} />
            {GUIDE.hero.stageCaption}
          </p>
        </div>
      ) : (
        <div className={styles.chat}>
          <div className={styles.deskHead}>
            <b>{GUIDE.hero.who}</b>
            <span className={`sk ${styles.pill}`}>
              <Sketch r={20} w={1.8} hatch="var(--yellow)" gap={7} hw={1.6} />
              {GUIDE.pill}
            </span>
            <span className={styles.online}>
              <i className={`dot${ask.available ? "" : " off"}`} />
              {ask.available ? GUIDE.hero.online : GUIDE.hero.off}
            </span>
            <button type="button" className={`link-btn ${styles.hide}`} onClick={closeChat}>
              {GUIDE.hero.hideChat}
            </button>
          </div>
          <div className={`${styles.desk}${asked ? ` ${styles.chatting}` : ""}`}>
            <div className={styles.gutter}>
              <svg ref={robotRef} className={robotClass} viewBox={ROBOT_VIEWBOX} aria-hidden="true" focusable="false" onClick={() => moodFor("jumping", 560)} />
            </div>
            <div className={styles.flow} ref={flow} aria-live="polite">
              <div className={`sk ${styles.greet}`}>
                <Sketch shape="left" tail="top" fill="var(--white)" c="var(--bubble)" w={2.4} />
                <p className={styles.hi}>
                  {GUIDE.hero.greetLead}{" "}
                  <span className="pink">
                    <Wavy delay={700}>{GUIDE.hero.greetAccent}</Wavy>
                  </span>
                </p>
                <p className={`fine ${styles.fine}`}>{GUIDE.greetingFine}</p>
              </div>
              <Thread msgs={ask.msgs} go={go} onPick={ask.onPick} onChip={ask.onChip} scopeName={scope?.name ?? null} />
              {ask.starters ? <Starters chips={ask.chips} onChip={ask.onChip} scopeName={scope?.name ?? null} /> : null}
            </div>
          </div>
          <div className={styles.composerWrap}>
            <form className={`sk ${styles.composer}`} onSubmit={submit} ref={composer}>
              <Sketch fill="var(--white)" r={18} w={2.8} />
              <Drawing kind="pencil" className={styles.pencil} />
              <input
                ref={input}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={example || GUIDE.placeholder}
                autoComplete="off"
                maxLength={GUIDE.limits.maxQuestionChars}
                aria-label={GUIDE.inputLabel}
              />
              <span className={styles.count}>
                {draft.length}/{GUIDE.limits.maxQuestionChars}
              </span>
              <button className="btn btn-ink sk" type="submit">
                <Sketch fill="var(--ink)" r={18} draw={false} />
                {GUIDE.send}
                <Icon name="send" className="ic" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
