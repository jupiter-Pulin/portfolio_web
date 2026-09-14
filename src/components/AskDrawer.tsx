"use client";

import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SITE, WORK } from "@/content/copy";
import { GUIDE, type AnswerKey, type Chip } from "@/content/guide";
import { PROJECTS, projectById } from "@/content/projects";
import {
  TYPING_MS,
  answerBlocks,
  openIntro,
  typingPlaceholder,
  type Action,
  type Block,
  type Run,
} from "@/lib/guideAnswer";
import { chipsFor, echoLabel, route } from "@/lib/guideRoute";
import { inlineNodes } from "@/lib/inlineMarkup";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { CopyEmailButton } from "./CopyEmailButton";
import { Icon } from "./Icon";
import styles from "./AskDrawer.module.css";

export type AskApi = {
  isOpen: boolean;
  /** Open the drawer, optionally scoped to one project id. */
  openAsk: (scopeId?: string) => void;
  closeAsk: () => void;
};

const AskContext = createContext<AskApi>({
  isOpen: false,
  openAsk: () => {},
  closeAsk: () => {},
});

export const useAsk = () => useContext(AskContext);

/** One transcript entry. A guide entry is either a typing placeholder or blocks. */
type ChatMsg = {
  key: number;
  who: "you" | "guide";
  text?: string;
  blocks?: Block[];
  typing?: string;
};

/**
 * The scripted guide. It renders once, below the
 * page, and holds the whole conversation. Nothing here talks to a model or a
 * server: every answer comes from src/content/guide.ts and src/content/projects.ts.
 */
export function AskProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  // Refs, not state: the callbacks below read the scope without being rebuilt.
  const scope = useRef<string | null>(null);
  const greeted = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const seq = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const append = useCallback((...added: ChatMsg[]) => {
    setMsgs((prev) => [...prev, ...added]);
  }, []);

  const setScope = useCallback((next: string | null) => {
    scope.current = next;
    setScopeId(next);
  }, []);

  /** The guide answers after a beat, unless the visitor asked for less motion. */
  const reply = useCallback(
    (blocks: Block[]) => {
      const placeholder = typingPlaceholder(reduced);
      const key = seq.current++;
      if (placeholder === null) {
        append({ key, who: "guide", blocks });
        return;
      }
      append({ key, who: "guide", typing: placeholder });
      timers.current.push(
        setTimeout(() => {
          setMsgs((prev) => prev.map((m) => (m.key === key ? { key, who: "guide", blocks } : m)));
        }, TYPING_MS),
      );
    },
    [append, reduced],
  );

  /** A chip or a pick: echo it as the visitor's line, then answer it. */
  const answer = useCallback(
    (key: AnswerKey, label: string, nextScope: string | null) => {
      // "← All questions" drops the scope; everything else keeps or sets it.
      const withScope = key === "all" ? null : nextScope;
      setScope(withScope);
      append({ key: seq.current++, who: "you", text: echoLabel(label) });
      reply(answerBlocks(key, withScope));
    },
    [append, reply, setScope],
  );

  const openAsk = useCallback(
    (nextScope?: string) => {
      trigger.current = (document.activeElement as HTMLElement | null) ?? null;
      const next = nextScope ?? null;
      const intro = openIntro({
        scopeId: next,
        previousScopeId: scope.current,
        greeted: greeted.current,
      });
      greeted.current = true;
      setScope(next);
      append(...intro.map((blocks) => ({ key: seq.current++, who: "guide" as const, blocks })));
      setIsOpen(true);
    },
    [append, setScope],
  );

  const closeAsk = useCallback(() => {
    setIsOpen(false);
    trigger.current?.focus();
  }, []);

  /** The case-page chip: the drawer steps aside first, then the page takes over. */
  const openProject = useCallback(
    (id: string) => {
      closeAsk();
      router.push(`/work/${id}`);
    },
    [closeAsk, router],
  );

  const onChip = useCallback(
    (chip: Chip) => answer(chip.key, chip.label, scope.current),
    [answer],
  );

  const onPick = useCallback(
    (id: string, then: AnswerKey) => answer(then, projectById(id)?.name ?? id, id),
    [answer],
  );

  const onAsk = useCallback(
    (typed: string) => {
      const next = route(typed, scope.current);
      setScope(next.scopeId);
      append({ key: seq.current++, who: "you", text: typed });
      reply(answerBlocks(next.key, next.scopeId));
    },
    [append, reply, setScope],
  );

  const api = useMemo(() => ({ isOpen, openAsk, closeAsk }), [isOpen, openAsk, closeAsk]);

  return (
    <AskContext.Provider value={api}>
      {children}
      <AskDrawer
        isOpen={isOpen}
        msgs={msgs}
        chips={chipsFor(scopeId ? projectById(scopeId)?.name ?? null : null)}
        onChip={onChip}
        onPick={onPick}
        onAsk={onAsk}
        onOpenProject={openProject}
        onClose={closeAsk}
      />
    </AskContext.Provider>
  );
}

function AskDrawer({
  isOpen,
  msgs,
  chips,
  onChip,
  onPick,
  onAsk,
  onOpenProject,
  onClose,
}: {
  isOpen: boolean;
  msgs: ChatMsg[];
  chips: Chip[];
  onChip: (chip: Chip) => void;
  onPick: (id: string, then: AnswerKey) => void;
  onAsk: (typed: string) => void;
  onOpenProject: (id: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLDivElement>(null);

  // The panel is in the DOM either way, so it is focusable the moment it opens.
  useEffect(() => {
    if (isOpen) input.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const el = transcript.current;
    if (isOpen && el) el.scrollTop = el.scrollHeight;
  }, [isOpen, msgs]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const typed = draft.trim();
    if (!typed) return;
    setDraft("");
    onAsk(typed);
  };

  return (
    <>
      <div
        className={`${styles.scrim}${isOpen ? ` ${styles.open}` : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${styles.drawer}${isOpen ? ` ${styles.open}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-title"
      >
        <div className={styles.askHead}>
          <div>
            <h2 id="ask-title">{SITE.askLabel}</h2>
            <span className={styles.pill}>{GUIDE.pill}</span>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label={WORK.close}>
            <Icon name="close" />
          </button>
        </div>
        <div className={styles.msgs} ref={transcript} aria-live="polite">
          {msgs.map((m) => (
            <Bubble key={m.key} msg={m} onOpen={onOpenProject} onPick={onPick} />
          ))}
        </div>
        <div className={styles.chips}>
          {chips.map((chip) => (
            <button
              className="chip"
              type="button"
              key={chip.key + chip.label}
              onClick={() => onChip(chip)}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <form className={styles.askForm} onSubmit={submit}>
          <input
            ref={input}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={GUIDE.placeholder}
            autoComplete="off"
            aria-label={GUIDE.inputLabel}
          />
          <button className="btn btn-primary sm" type="submit">
            {GUIDE.send}
          </button>
        </form>
      </aside>
    </>
  );
}

function Bubble({
  msg,
  onOpen,
  onPick,
}: {
  msg: ChatMsg;
  onOpen: (id: string) => void;
  onPick: (id: string, then: AnswerKey) => void;
}) {
  if (msg.typing) {
    return <div className={`${styles.msg} ${styles.guide} ${styles.typing}`}>{msg.typing}</div>;
  }
  if (msg.who === "you") {
    // The visitor's own words, as text: nothing in them is ever parsed as markup.
    return <div className={`${styles.msg} ${styles.you}`}>{msg.text}</div>;
  }
  return (
    <div className={`${styles.msg} ${styles.guide}`}>
      {(msg.blocks ?? []).map((block, i) => (
        <BlockNode key={i} block={block} onOpen={onOpen} onPick={onPick} />
      ))}
    </div>
  );
}

/** Content runs: <em> and <code> come from the string, every other tag is text. */
const runNodes = (runs: Run[]): ReactNode[] =>
  runs.map((run, i) =>
    run.t === "br" ? (
      <br key={i} />
    ) : run.t === "b" ? (
      <b key={i}>{run.v}</b>
    ) : run.t === "fine" ? (
      <span key={i} className="fine">
        {run.v}
      </span>
    ) : (
      <Fragment key={i}>{inlineNodes(run.v)}</Fragment>
    ),
  );

function BlockNode({
  block,
  onOpen,
  onPick,
}: {
  block: Block;
  onOpen: (id: string) => void;
  onPick: (id: string, then: AnswerKey) => void;
}) {
  switch (block.kind) {
    case "p":
      return <p className={block.fine ? "fine" : undefined}>{runNodes(block.runs)}</p>;
    case "report":
      return (
        <div className={styles.report}>
          <div className={styles.rpHead}>
            <span>{GUIDE.reportLabel}</span>
            <b>{block.title}</b>
          </div>
          <ol className={styles.rpList}>
            {block.items.map((item, i) => (
              <li key={i}>
                {runNodes(item.runs)}
                {item.action ? (
                  <>
                    <br />
                    <ActionChip action={item.action} onOpen={onOpen} />
                  </>
                ) : null}
              </li>
            ))}
          </ol>
          {block.note ? <p className={styles.rpNote}>{block.note}</p> : null}
          <div className={styles.rpActions}>
            {block.actions.map((a, i) => (
              <ActionChip key={i} action={a} onOpen={onOpen} />
            ))}
          </div>
        </div>
      );
    case "rows":
      return (
        <ul className={styles.linklist}>
          {block.rows.map((row, i) => (
            <li key={i}>
              <span>{row.label}</span>
              {row.right.t === "muted" ? (
                <span className={styles.muted}>{row.right.text}</span>
              ) : (
                <ActionChip action={row.right} onOpen={onOpen} />
              )}
            </li>
          ))}
        </ul>
      );
    case "actions":
      return (
        <div className={styles.actions}>
          {block.actions.map((a, i) => (
            <ActionChip key={i} action={a} onOpen={onOpen} />
          ))}
        </div>
      );
    case "picks":
      return (
        <div className={styles.actions}>
          {PROJECTS.map((p) => (
            <button
              className="chip"
              type="button"
              key={p.id}
              onClick={() => onPick(p.id, block.then)}
            >
              {p.name}
            </button>
          ))}
        </div>
      );
  }
}

/** The four things the guide can offer: a case page, mail, the clipboard, a link. */
function ActionChip({ action, onOpen }: { action: Action; onOpen: (id: string) => void }) {
  const amber = "amber" in action && action.amber ? " amber" : "";
  switch (action.t) {
    case "mail":
      return (
        <a className={`chip${amber}`} href={action.href}>
          {action.label}
        </a>
      );
    case "link":
      return (
        <a className={`chip${amber}`} href={action.href} target="_blank" rel="noopener">
          {action.label}
        </a>
      );
    case "copy":
      return <CopyEmailButton className="chip" label={action.label} />;
    case "open":
      return (
        <button className="chip" type="button" onClick={() => onOpen(action.id)}>
          {action.label}
        </button>
      );
  }
}
