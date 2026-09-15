// The work strip's drift, as arithmetic the component only applies each frame.

/** How fast the strip drifts on its own, in px per ms (30 px/s). */
export const DRIFT_PX_PER_MS = 0.028;

/**
 * The next scroll offset after `elapsedMs`: the strip holds every tile twice,
 * so once the first copy has scrolled past, the offset wraps to the second.
 */
export const nextOffset = (x: number, elapsedMs: number, loopWidth: number): number => {
  const next = x + elapsedMs * DRIFT_PX_PER_MS;
  return loopWidth > 0 && next >= loopWidth ? next - loopWidth : next;
};
