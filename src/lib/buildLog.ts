// Timing of the terminal checklist in the "How I Build" card: 600ms, then +420ms a line.
export const FIRST_LINE_MS = 600;
export const LINE_STEP_MS = 420;

export const lineDelay = (index: number): number => FIRST_LINE_MS + index * LINE_STEP_MS;

/** How many checklist lines are ticked `elapsed` ms after mount. */
export const doneCountAt = (elapsed: number, total: number, reduced: boolean): number => {
  if (reduced) return total;
  let done = 0;
  while (done < total && lineDelay(done) <= elapsed) done++;
  return done;
};
