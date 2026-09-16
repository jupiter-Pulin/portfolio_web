// The work strip's drift, as arithmetic the component only applies each frame.

/** How fast the strip drifts on its own, in px per ms (30 px/s). */
export const DRIFT_PX_PER_MS = 0.028;

/**
 * How many copies of the tiles the track has to hold. A browser stops scrolling
 * at `scrollWidth - clientWidth`, so the copies behind the first one have to
 * cover the visible width plus the gutter the drift travels through
 * (`leadWidth`) — otherwise a viewport-wide strip stalls at the end of its
 * scroll and snaps back when the offset wraps.
 */
export const copiesFor = (containerWidth: number, loopWidth: number, leadWidth = 0): number =>
  loopWidth > 0 ? Math.max(2, Math.ceil((containerWidth + leadWidth) / loopWidth) + 1) : 2;

/**
 * The next scroll offset after `elapsedMs`. The row repeats every `loopWidth`
 * from `leadWidth` on — that gutter, which holds the first tile under the head,
 * is only ever empty on the first pass. So the drift runs on through it once
 * and from then on wraps inside `[leadWidth, leadWidth + loopWidth)`, where a
 * wrap lands on the same picture it left.
 */
export const nextOffset = (x: number, elapsedMs: number, loopWidth: number, leadWidth = 0): number => {
  const next = x + elapsedMs * DRIFT_PX_PER_MS;
  return loopWidth > 0 && next >= leadWidth + loopWidth ? next - loopWidth : next;
};
