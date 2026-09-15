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
  askBody,
  askGuide,
  hudLines,
  nextKey,
  nextLangSample,
  pendingMsgs,
  settleMsgs,
  type AskInput,
  type AskResult,
  type ChatMsg,
  type HudMeta,
  isPending,
} from "@/lib/askClient";
import { openIntro, type Action, type Block, type Run } from "@/lib/guideAnswer";
import { chipsFor, echoLabel } from "@/lib/guideRoute";
import { shortAddress } from "@/lib/answerMarkup";
import { inlineNodes } from "@/lib/inlineMarkup";
import { CopyEmailButton } from "./CopyEmailButton";
import { Icon } from "./Icon";
import styles from "./AskDrawer.module.css";

/** The home page console announces itself so openAsk can focus it instead of the drawer. */
export type InlineHost = { focus: () => void };

export type AskApi = {
  isOpen: boolean;
  /** Open the guide, optionally scoped to one project id: the drawer, or the home page console when one is mounted. */
  openAsk: (scopeId?: string) => void;
  closeAsk: () => void;
  /** The one conversation, shared by the drawer and the home page console. */
  msgs: ChatMsg[];
  scopeId: string | null;
  chips: Chip[];
  /** The home page console's starting points are on offer: nothing asked yet, or a project was just opened. */
  starters: boolean;
  /** False once the server has said the guide is switched off. */
  available: boolean;
  onChip: (chip: Chip) => void;
  onPick: (id: string, then: AnswerKey) => void;
  onAsk: (typed: string) => void;
  /** Put one project in scope, or none, without asking anything. */
  startScope: (id: string | null) => void;
  openProject: (id: string) => void;
  navigate: (href: string) => void;
  registerInline: (host: InlineHost | null) => void;
};

const noop = () => {};
const AskContext = createContext<AskApi>({
  isOpen: false,
  openAsk: noop,
  closeAsk: noop,
  msgs: [],
  scopeId: null,
  chips: [],
  starters: true,
  available: true,
  onChip: noop,
  onPick: noop,
  onAsk: noop,
  startScope: noop,
  openProject: noop,
  navigate: noop,
  registerInline: noop,
});

export const useAsk = () => useContext(AskContext);

/**
 * The site guide. It renders once, below the page, and holds the whole
 * conversation. Typed questions, chips and picks all go to /api/ask, where a
 * paid model writes the answer text; the links and buttons under it are built
 * from src/content. When the model is not reached, the drawer shows fixed copy
 * from src/content/guide.ts — never a canned answer. The home page mounts the
 * same conversation in place (GuideConsole); there, opening the guide focuses
 * that console instead of sliding the drawer in.
 */
export function AskProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [starters, setStarters] = useState(true);
  const [available, setAvailable] = useState(true);
  // Refs, not state: the callbacks below read them without being rebuilt.
  const scope = useRef<string | null>(null);
  // The visitor's last typed question: the language every answer is written in.
  const langSample = useRef<string | null>(null);
  const busy = useRef(false);
  const greeted = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const inline = useRef<InlineHost | null>(null);

  const append = useCallback((...added: Omit<ChatMsg, "key">[]) => {
    setMsgs((prev) => {
      const at = nextKey(prev);
      return [...prev, ...added.map((m, i) => ({ ...m, key: at + i }))];
    });
  }, []);

  const setScope = useCallback((next: string | null) => {
    scope.current = next;
    setScopeId(next);
  }, []);

  /** The visitor's line and the typing placeholder go up before the request leaves; the starting points step aside. */
  const begin = useCallback((echo: string) => {
    busy.current = true;
    setStarters(false);
    setMsgs((prev) => pendingMsgs(prev, echo));
  }, []);

  /** The placeholder becomes the outcome; only an answer moves the scope. */
  const finish = useCallback(
    (result: AskResult, sent: { scopeId: string | null; langSample: string | null }) => {
      busy.current = false;
      if (result.kind === "unavailable") setAvailable(false);
      const settled = settleMsgs([], result, sent);
      setMsgs((prev) => settleMsgs(prev, result, sent).msgs);
      setScope(settled.scopeId);
    },
    [setScope],
  );

  const openAsk = useCallback(
    (nextScope?: string) => {
      // A project opened from the page starts over: its questions are offered again.
      if (nextScope !== undefined) setStarters(true);
      // On the home page the conversation is already on screen: go there.
      if (inline.current) {
        if (nextScope !== undefined) setScope(nextScope);
        inline.current.focus();
        return;
      }
      trigger.current = (document.activeElement as HTMLElement | null) ?? null;
      const next = nextScope ?? null;
      const intro = openIntro({
        scopeId: next,
        previousScopeId: scope.current,
        greeted: greeted.current,
      });
      greeted.current = true;
      setScope(next);
      append(...intro.map((blocks) => ({ who: "guide" as const, blocks })));
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

  /** An in-site entry such as the projects page: same order, drawer first. */
  const navigate = useCallback(
    (href: string) => {
      closeAsk();
      router.push(href);
    },
    [closeAsk, router],
  );

  const onChip = useCallback(
    async (chip: Chip) => {
      if (busy.current) return;
      // "← All questions" only leaves the project; there is nothing to ask the model.
      if (chip.key === "all") {
        setScope(null);
        append({ who: "guide", blocks: [{ kind: "p", runs: [{ t: "text", v: GUIDE.all }] }] });
        return;
      }
      const input: AskInput = { via: "chip", question: echoLabel(chip.label), intent: chip.key };
      const convo = { scopeId: scope.current, langSample: langSample.current };
      begin(input.question);
      finish(await askGuide(askBody(input, convo)), convo);
    },
    [append, begin, finish, setScope],
  );

  const startScope = useCallback((id: string | null) => setScope(id), [setScope]);

  /** The console shows the greeting itself, so the drawer never repeats it afterwards. */
  const registerInline = useCallback((host: InlineHost | null) => {
    inline.current = host;
    if (host) greeted.current = true;
  }, []);

  const onPick = useCallback(
    async (id: string, then: AnswerKey) => {
      if (busy.current) return;
      const input: AskInput = { via: "pick", question: projectById(id)?.name ?? id, intent: then };
      const before = { scopeId: scope.current, langSample: langSample.current };
      begin(input.question);
      // A pick asks about the project it names; a failure leaves the scope where it was.
      finish(await askGuide(askBody(input, { ...before, scopeId: id })), before);
    },
    [begin, finish],
  );

  const onAsk = useCallback(
    async (typed: string) => {
      if (busy.current) return;
      const input: AskInput = { via: "typed", question: typed };
      const convo = { scopeId: scope.current, langSample: langSample.current };
      langSample.current = nextLangSample(langSample.current, input);
      begin(typed);
      finish(await askGuide(askBody(input, convo)), { ...convo, langSample: langSample.current });
    },
    [begin, finish],
  );

  const chips = useMemo(() => chipsFor(scopeId ? projectById(scopeId)?.name ?? null : null), [scopeId]);

  const api = useMemo<AskApi>(
    () => ({
      isOpen,
      openAsk,
      closeAsk,
      msgs,
      scopeId,
      chips,
      starters,
      available,
      onChip,
      onPick,
      onAsk,
      startScope,
      openProject,
      navigate,
      registerInline,
    }),
    [isOpen, openAsk, closeAsk, msgs, scopeId, chips, starters, available, onChip, onPick, onAsk, startScope, openProject, navigate, registerInline],
  );

  return (
    <AskContext.Provider value={api}>
      {children}
      <AskDrawer
        isOpen={isOpen}
        msgs={msgs}
        chips={chips}
        onChip={onChip}
        onPick={onPick}
        onAsk={onAsk}
        onOpenProject={openProject}
        onNavigate={navigate}
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
  onNavigate,
  onClose,
}: {
  isOpen: boolean;
  msgs: ChatMsg[];
  chips: Chip[];
  onChip: (chip: Chip) => void;
  onPick: (id: string, then: AnswerKey) => void;
  onAsk: (typed: string) => void;
  onOpenProject: (id: string) => void;
  onNavigate: (href: string) => void;
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
    // One question at a time: while the guide is answering, the draft stays put.
    if (!typed || isPending(msgs)) return;
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
            <Bubble key={m.key} msg={m} go={{ open: onOpenProject, nav: onNavigate }} onPick={onPick} />
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
            maxLength={GUIDE.limits.maxQuestionChars}
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

/** Where an action chip can take the visitor: a case page, or another page of the site. */
export type Go = { open: (id: string) => void; nav: (href: string) => void };

/** One transcript line, shared by the drawer and the home page console. */
export function Bubble({
  msg,
  go,
  onPick,
}: {
  msg: ChatMsg;
  go: Go;
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
        <BlockNode key={i} block={block} go={go} onPick={onPick} />
      ))}
      {msg.meta ? <Hud meta={msg.meta} /> : null}
    </div>
  );
}

/** "Under the hood": what the server did for this answer, folded away until asked for. */
function Hud({ meta }: { meta: HudMeta }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={styles.hudToggle} type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {GUIDE.hud.toggle}
      </button>
      {open ? (
        <div className={styles.hud}>
          {hudLines(meta).map((line) => (
            <Fragment key={line.label}>
              <b>{line.label}</b>
              <span>{line.text}</span>
            </Fragment>
          ))}
          <p className={styles.hudNote}>{GUIDE.hud.note}</p>
        </div>
      ) : null}
    </>
  );
}

/** Content runs: <em> and <code> come from the string, every other tag is text.
    The typed runs are what the site recognised in a model line (see answerMarkup.ts). */
const runNodes = (runs: Run[], go: Go): ReactNode[] =>
  runs.map((run, i) => {
    switch (run.t) {
      case "br":
        return <br key={i} />;
      case "b":
        return <b key={i}>{run.v}</b>;
      case "fine":
        return (
          <span key={i} className="fine">
            {run.v}
          </span>
        );
      case "ent":
        return (
          <button key={i} type="button" className={styles.ent} onClick={() => go.open(run.id)}>
            {run.v}
          </button>
        );
      case "tech":
        return (
          <span key={i} className={styles.tech}>
            {run.v}
          </span>
        );
      case "num":
        return (
          <span key={i} className={styles.num}>
            {run.v}
          </span>
        );
      case "link":
        return run.mail ? (
          <a key={i} className={styles.mailRun} href={run.href}>
            {run.v}
          </a>
        ) : (
          <a key={i} className={styles.linkRun} href={run.href} target="_blank" rel="noopener">
            {shortAddress(run.v)}
          </a>
        );
      default:
        return <Fragment key={i}>{inlineNodes(run.v)}</Fragment>;
    }
  });

function BlockNode({
  block,
  go,
  onPick,
}: {
  block: Block;
  go: Go;
  onPick: (id: string, then: AnswerKey) => void;
}) {
  switch (block.kind) {
    case "p":
      return <p className={block.fine ? "fine" : undefined}>{runNodes(block.runs, go)}</p>;
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
                {runNodes(item.runs, go)}
                {item.action ? (
                  <>
                    <br />
                    <ActionChip action={item.action} go={go} />
                  </>
                ) : null}
              </li>
            ))}
          </ol>
          {block.note ? <p className={styles.rpNote}>{block.note}</p> : null}
          <div className={styles.rpActions}>
            {block.actions.map((a, i) => (
              <ActionChip key={i} action={a} go={go} />
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
                <ActionChip action={row.right} go={go} />
              )}
            </li>
          ))}
        </ul>
      );
    case "actions":
      return (
        <div className={styles.actions}>
          {block.actions.map((a, i) => (
            <ActionChip key={i} action={a} go={go} />
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

/** What the guide can offer: a case page, a site page, mail, the clipboard, a link, or a placeholder. */
function ActionChip({ action, go }: { action: Action; go: Go }) {
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
        <button className="chip" type="button" onClick={() => go.open(action.id)}>
          {action.label}
        </button>
      );
    case "nav":
      return (
        <button className="chip" type="button" onClick={() => go.nav(action.href)}>
          {action.label}
        </button>
      );
  }
}
