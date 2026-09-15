"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { GUIDE } from "@/content/guide";
import { PROJECTS, projectById } from "@/content/projects";
import { hasAsked, isPending } from "@/lib/askClient";
import { ASK_CLIENT_TIMEOUT_MS } from "@/lib/askContract";
import { Bubble, useAsk } from "./AskDrawer";
import { Icon } from "./Icon";
import styles from "./GuideConsole.module.css";

/**
 * The guide on the home page: its greeting as the headline, the conversation
 * growing in place beneath it, quick questions and the projects as starting
 * points until something is asked, and the composer. State and requests live in
 * AskProvider; this only renders.
 */
export function GuideConsole() {
  const ask = useAsk();
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const thread = useRef<HTMLDivElement>(null);

  // The header button and the work strip land here while this console is on the page.
  const { registerInline } = ask;
  useEffect(() => {
    registerInline({
      focus: () => {
        root.current?.scrollIntoView({ block: "start" });
        input.current?.focus({ preventScroll: true });
      },
    });
    return () => registerInline(null);
  }, [registerInline]);

  // The newest line stays in view as the thread grows.
  const lines = ask.msgs.length;
  useEffect(() => {
    if (lines > 0) thread.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const typed = draft.trim();
    // One question at a time: while the guide is answering, the draft stays put.
    if (!typed || isPending(ask.msgs)) return;
    setDraft("");
    ask.onAsk(typed);
  };

  const scope = ask.scopeId ? projectById(ask.scopeId) : undefined;
  const go = { open: ask.openProject, nav: ask.navigate };

  return (
    <div className={styles.console} ref={root}>
      <div className={styles.bubble}>
        <div className={styles.who}>
          <span className={styles.name}>{GUIDE.hero.who}</span>
          <span className={styles.pill}>{GUIDE.pill}</span>
          <span className={`${styles.status}${ask.available ? "" : ` ${styles.off}`}`}>
            <i />
            {ask.available ? GUIDE.hero.online : GUIDE.hero.off}
          </span>
        </div>
        {/* Once something is asked the greeting folds away; who is answering stays. */}
        <div className={`${styles.greet}${hasAsked(ask.msgs) ? ` ${styles.gone}` : ""}`}>
          <div>
            <h2 className={styles.headline}>
              {GUIDE.hero.headline} <span className={styles.grad}>{GUIDE.hero.headlineAccent}</span>
            </h2>
            <p className={`fine ${styles.fine}`}>{GUIDE.greetingFine}</p>
          </div>
        </div>
      </div>

      {lines > 0 ? (
        <div className={styles.thread} ref={thread} aria-live="polite">
          {ask.msgs.map((m) => (
            <Bubble key={m.key} msg={m} go={go} onPick={ask.onPick} />
          ))}
        </div>
      ) : null}

      {ask.starters ? (
        <>
          <div className={styles.quick}>
            <span className={styles.label}>
              {scope ? `${GUIDE.hero.scopedLabel} ${scope.name}` : GUIDE.hero.quickLabel}
            </span>
            {ask.chips.map((chip) => (
              <button
                className="chip"
                type="button"
                key={chip.key + chip.label}
                onClick={(e) => {
                  ask.onChip(chip);
                  // A chip pressed from the keyboard is about to leave the page: the composer takes the focus.
                  if (e.detail === 0) input.current?.focus({ preventScroll: true });
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className={styles.quick}>
            <span className={styles.label}>{GUIDE.hero.startLabel}</span>
            {PROJECTS.map((p) => (
              <button
                className="chip"
                type="button"
                key={p.id}
                aria-pressed={ask.scopeId === p.id}
                onClick={() => ask.startScope(p.id)}
              >
                <i className={`${styles.dot} ${styles[p.hue]}`} />
                {p.name}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <form className={styles.composer} onSubmit={submit}>
        <Icon name="spark" className={styles.spark} />
        <input
          ref={input}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={GUIDE.placeholder}
          autoComplete="off"
          maxLength={GUIDE.limits.maxQuestionChars}
          aria-label={GUIDE.inputLabel}
        />
        <span className={styles.count}>
          {draft.length}/{GUIDE.limits.maxQuestionChars}
        </span>
        <button className="btn btn-primary sm" type="submit">
          <Icon name="send" className="ic" />
          <span className={styles.sendLabel}>{GUIDE.send}</span>
        </button>
      </form>
      <ul className={styles.rules}>
        <li>{GUIDE.hero.rules.quota(GUIDE.limits.visitorDailyQuestions)}</li>
        <li>{GUIDE.hero.rules.language}</li>
        <li>{GUIDE.hero.rules.wait(ASK_CLIENT_TIMEOUT_MS / 1000)}</li>
        <li>{GUIDE.hero.rules.behalf}</li>
      </ul>
    </div>
  );
}
