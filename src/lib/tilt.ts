// Pointer-tilt maths for the "How I Build" window card, kept as pure functions
// so the formulas from design/mock/index.html can be asserted without a browser.
export const TILT_Y_DEG = 16;
export const TILT_X_DEG = 12;
export const PINNED_TRANSFORM = "rotateY(-10deg) rotateX(6deg) scale(1.02)";
export const RESET_TRANSFORM = "";

export type Rect = { left: number; top: number; width: number; height: number };
export type Offset = { px: number; py: number };
export type PointerState = { reduced: boolean; pinned: boolean; pointerType: string };

/** The mock ignores touch pointers, a pinned card and reduced-motion users. */
export const canTilt = ({ reduced, pinned, pointerType }: PointerState): boolean =>
  !reduced && !pinned && pointerType !== "touch";

/** Pointer position inside the stage, as -0.5 … 0.5 on each axis. */
export const pointerOffset = (rect: Rect, clientX: number, clientY: number): Offset => ({
  px: (clientX - rect.left) / rect.width - 0.5,
  py: (clientY - rect.top) / rect.height - 0.5,
});

export const tiltTransform = ({ px, py }: Offset): string =>
  `rotateY(${(px * TILT_Y_DEG).toFixed(2)}deg) rotateX(${(-py * TILT_X_DEG).toFixed(2)}deg)`;

/** Position of the glare highlight, written to --gx / --gy on the card. */
export const glarePosition = ({ px, py }: Offset): { gx: string; gy: string } => ({
  gx: `${((px + 0.5) * 100).toFixed(1)}%`,
  gy: `${((py + 0.5) * 100).toFixed(1)}%`,
});
