// The work strip's drift, as arithmetic the component only applies each frame.

/** How fast the strip drifts on its own, in px per ms (30 px/s). */
export const DRIFT_PX_PER_MS = 0.028;

/**
 * How many copies of the tiles the track has to hold. A browser stops scrolling
 * at `scrollWidth - clientWidth`, so every copy but the last one has to cover
 * the visible width — otherwise a viewport-wide strip stalls at the end of its
 * scroll and snaps back when the offset wraps.
 */
export const copiesFor = (containerWidth: number, loopWidth: number): number =>
  loopWidth > 0 ? Math.max(2, Math.ceil(containerWidth / loopWidth) + 1) : 2;

/**
 * The next scroll offset after `elapsedMs`: the strip holds every tile twice,
 * so once the first copy has scrolled past, the offset wraps to the second.
 */
export const nextOffset = (x: number, elapsedMs: number, loopWidth: number): number => {
  const next = x + elapsedMs * DRIFT_PX_PER_MS;
  return loopWidth > 0 && next >= loopWidth ? next - loopWidth : next;
};
