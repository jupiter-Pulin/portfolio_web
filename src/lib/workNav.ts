// Navigation arithmetic and key mapping for the case pages, kept out of the
// client component so both can be asserted without a browser.

/** Index `dir` steps from `cur`, wrapping at both ends. */
export function nextIndex(cur: number, dir: number, total: number): number {
  if (total <= 0) return 0;
  return (((cur + dir) % total) + total) % total;
}

export type WorkKey = "prev" | "next" | "close";

/** Elements that swallow the arrow keys because the visitor is typing in them. */
const TYPING = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export type KeyTarget = { tagName?: string; isContentEditable?: boolean } | null | undefined;

/** What a keydown means on a case page, or null when it means nothing.
    An open ask drawer owns the keyboard: Esc closes it, and the arrows stay put. */
export function keyAction(
  key: string,
  target?: KeyTarget,
  opts?: { askOpen?: boolean },
): WorkKey | null {
  if (opts?.askOpen) return null;
  if (target?.isContentEditable) return null;
  if (TYPING.has((target?.tagName ?? "").toUpperCase())) return null;
  if (key === "ArrowLeft") return "prev";
  if (key === "ArrowRight") return "next";
  if (key === "Escape") return "close";
  return null;
}
