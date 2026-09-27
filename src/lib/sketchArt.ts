// The site's drawings, built with the pen from sketch.ts: the assistant robot
// (the videos' AI character), one small diagram per project, and the bits of
// stationery around them. Words inside the drawings come from content/copy.ts.
import { ART } from "../content/copy.ts";
import { catmull, el, ell, f1, pen, rr, wavy, type Pen } from "./sketch.ts";

const C = {
  ink: "var(--ink)",
  white: "var(--white)",
  mint: "var(--mint)",
  blue: "var(--blue)",
  yellow: "var(--yellow)",
  pink: "var(--pink)",
  blush: "var(--blush)",
  lav: "var(--lav)",
  green: "var(--green)",
  grey: "var(--grey)",
  lgrey: "var(--lgrey)",
  bubble: "var(--bubble)",
};

/** The project hues as CSS variables. */
export const HUE_VAR = { green: C.green, amber: C.yellow, cyan: C.mint, blue: C.blue, violet: C.lav } as const;

/**
 * Nolan's assistant: mint-hatched square head and body, a screen face, a pink
 * antenna ball and a yellow button. Feet are the origin; viewBox "-122 -372 244 382".
 * Legs, upper body and arms sit in their own groups so CSS can make it walk, wave,
 * think and talk (see the .robot rules in globals.css).
 */
export function buildRobot(svg: SVGSVGElement) {
  const p = pen(svg, 77);
  const root = el("g", null, svg);
  el("ellipse", { cx: 0, cy: -4, rx: 76, ry: 9, fill: "var(--shadow-2)" }, root);
  const legL = el("g", { class: "rb-leg-l" }, el("g", { transform: "translate(-22 -50)" }, root));
  p.line(legL, "M0,0L-2,32");
  el("ellipse", { cx: -8, cy: 41, rx: 24, ry: 10, fill: C.ink, class: "fill" }, legL);
  const legR = el("g", { class: "rb-leg-r" }, el("g", { transform: "translate(22 -50)" }, root));
  p.line(legR, "M0,0L2,32");
  el("ellipse", { cx: 8, cy: 41, rx: 24, ry: 10, fill: C.ink, class: "fill" }, legR);
  const up = el("g", { class: "rb-upper" }, root);
  p.shape(up, rr(-58, -160, 116, 110, 20), { fill: C.white, hatch: C.mint });
  p.shape(up, ell(0, -106, 14), { fill: C.yellow, w: 3, amp: 0.5 });
  const armL = el("g", { class: "rb-swing-l" }, el("g", { transform: "translate(-58 -138)" }, up));
  p.line(armL, "M0,0Q-28,16 -34,52");
  p.shape(armL, ell(-36, 66, 15), { fill: C.white, w: 3.2, amp: 0.7 });
  const armR = el("g", { class: "rb-swing-r" }, el("g", { transform: "translate(58 -138)" }, up));
  const down = el("g", { class: "rb-arm-down" }, armR);
  p.line(down, "M0,0Q28,16 34,52");
  p.shape(down, ell(36, 66, 15), { fill: C.white, w: 3.2, amp: 0.7 });
  const wave = el("g", { class: "rb-arm-up" }, armR);
  p.line(wave, "M0,0Q34,-14 46,-56");
  p.shape(wave, ell(48, -66, 15), { fill: C.white, w: 3.2, amp: 0.7 });
  const head = el("g", { transform: "translate(0 -232)" }, up);
  p.line(head, "M0,-68L0,-104", { amp: 0.6 });
  const ant = el("g", { class: "rb-ant" }, el("g", { transform: "translate(0 -117)" }, head));
  p.shape(ant, ell(0, 0, 13), { fill: C.pink, w: 3, amp: 0.5 });
  p.shape(head, rr(-84, -68, 168, 138, 30), { fill: C.white, hatch: C.mint });
  p.shape(head, rr(-60, -44, 120, 90, 18), { fill: C.white, w: 3.2 });
  const look = el("g", { class: "rb-eyes-look" }, el("g", { transform: "translate(0 -4)" }, head));
  const eyes = el("g", { class: "rb-eyes-in" }, look);
  for (const ex of [-24, 24]) el("ellipse", { cx: ex, cy: 0, rx: 9, ry: 12, fill: C.ink, class: "fill" }, eyes);
  const dots = el("g", { class: "rb-dots" }, head);
  for (const dx of [-26, 0, 26]) el("circle", { cx: dx, cy: 0, r: 7, fill: C.ink }, dots);
  for (const bx of [-43, 43]) el("ellipse", { cx: bx, cy: 22, rx: 10, ry: 6, fill: C.blush, "fill-opacity": 0.9, class: "fill" }, head);
  p.line(el("g", { class: "rb-smile" }, head), "M-12,24Q0,35 12,24", { w: 3.2, amp: 0.4 });
  p.shape(el("g", { class: "rb-open" }, head), "M-13,21Q0,40 13,21Z", { fill: C.ink, w: 2.6, amp: 0.4 });
}
export const ROBOT_VIEWBOX = "-122 -372 244 382";

/** Just the robot's head, for small places such as the drawer's header. viewBox "-90 -110 180 190". */
export function buildRobotHead(svg: SVGSVGElement) {
  const p = pen(svg, 78);
  const head = el("g", null, svg);
  p.line(head, "M0,-68L0,-92", { amp: 0.4 });
  p.shape(head, ell(0, -100, 11), { fill: C.pink, w: 3, amp: 0.4 });
  p.shape(head, rr(-84, -68, 168, 138, 30), { fill: C.white, hatch: C.mint });
  p.shape(head, rr(-60, -44, 120, 90, 18), { fill: C.white, w: 3.2 });
  for (const ex of [-24, 24]) el("ellipse", { cx: ex, cy: -4, rx: 9, ry: 12, fill: C.ink, class: "fill" }, head);
  for (const bx of [-43, 43]) el("ellipse", { cx: bx, cy: 22, rx: 10, ry: 6, fill: C.blush, "fill-opacity": 0.9, class: "fill" }, head);
  p.line(head, "M-12,24Q0,35 12,24", { w: 3.2, amp: 0.4 });
}
export const ROBOT_HEAD_VIEWBOX = "-90 -116 180 194";

type ArtFn = (p: Pen, s: SVGSVGElement) => void;

/** One small diagram per project: the mechanism at a glance. Wide ones are 600 × 156, the rest 320 × 156. */
export const PROJECT_ART: Record<string, { w: number; draw: ArtFn }> = {
  platter: {
    w: 600,
    draw(p, s) {
      const a = ART.platter;
      a.chains.forEach((label, i) => {
        const y = 30 + i * 45;
        p.shape(s, ell(66, y, 16), { fill: C.white, hatch: C.green, gap: 6, w: 2.4 });
        p.text(s, 42, y + 5, label, { size: 15, a: "end" });
        p.line(s, `M84,${y}Q108,${y} 128,${75 + (i - 1) * 10}`, { w: 2, c: C.lgrey });
      });
      p.shape(s, rr(130, 48, 130, 56, 10), { fill: C.white, w: 2.6 });
      p.text(s, 195, 72, a.api, { size: 16 });
      p.text(s, 195, 92, a.unsigned, { size: 14, c: C.grey });
      p.arrow(s, 264, 76, 290, 60, 318, 76, { w: 2.4 });
      p.shape(s, rr(326, 50, 96, 56, 10), { fill: C.white, hatch: C.yellow, gap: 7, w: 2.6 });
      p.shape(s, rr(396, 66, 26, 22, 6), { fill: C.white, w: 2.2 });
      p.text(s, 362, 126, a.sign, { size: 16 });
      p.line(s, "M440,58L450,70L468,44", { c: C.pink, w: 3.6, amp: 0.4 });
      p.text(s, 520, 36, a.note[0], { size: 17, c: C.pink, rot: -5 });
      p.text(s, 522, 56, a.note[1], { size: 17, c: C.pink, rot: -5 });
      p.arrow(s, 520, 70, 520, 110, 470, 120, { c: C.pink, w: 2 });
    },
  },
  loop: {
    w: 320,
    draw(p, s) {
      const a = ART.loop;
      p.shape(s, ell(96, 76, 40, 30), { fill: C.white, hatch: C.yellow, gap: 7, w: 2.6 });
      p.text(s, 96, 82, a.router, { size: 17 });
      const at: [number, number][] = [[26, 26], [166, 22], [176, 128], [22, 128]];
      a.steps.forEach((label, i) => {
        const [x, y] = at[i];
        p.shape(s, rr(x - 26, y - 12, 52, 22, 8), { fill: C.white, w: 2 });
        p.text(s, x, y + 5, label, { size: 14 });
        p.arrow(s, 96 + (x - 96) * 0.42, 76 + (y - 76) * 0.42, 96 + (x - 96) * 0.6, 76 + (y - 76) * 0.5, 96 + (x - 96) * 0.72, 76 + (y - 76) * 0.72, { w: 1.8, hl: 7 });
      });
      p.line(s, "M226,20L226,132", { w: 2, c: C.lgrey });
      p.text(s, 272, 44, a.note[0], { size: 15, c: C.pink, rot: -4 });
      p.text(s, 272, 62, a.note[1], { size: 15, c: C.pink, rot: -4 });
      el("circle", { cx: 272, cy: 96, r: 9, fill: C.white, stroke: C.ink, "stroke-width": 2.2, class: "fill" }, s);
      p.line(s, "M272,105L272,122M262,112L282,112M272,122L264,134M272,122L280,134", { w: 2.2, amp: 0.3 });
      p.text(s, 272, 150, a.human, { size: 13, c: C.grey });
    },
  },
  guide: {
    w: 320,
    draw(p, s) {
      p.shape(s, rr(24, 44, 76, 64, 16), { fill: C.white, hatch: C.mint, gap: 8 });
      p.shape(s, rr(36, 54, 52, 42, 10), { fill: C.white, w: 2.4 });
      el("ellipse", { cx: 52, cy: 72, rx: 4, ry: 5.5, fill: C.ink, class: "fill" }, s);
      el("ellipse", { cx: 72, cy: 72, rx: 4, ry: 5.5, fill: C.ink, class: "fill" }, s);
      p.line(s, "M62,44L62,28", { w: 2.4 });
      p.shape(s, ell(62, 22, 6), { fill: C.pink, w: 2 });
      p.shape(s, rr(126, 26, 180, 74, 14), { fill: C.white, c: C.bubble, w: 2.4 });
      p.line(s, "M126,84L108,98L130,72", { c: C.bubble, w: 2.2, amp: 0.3 });
      [[46, 150], [66, 130], [86, 110]].forEach(([y, w]) => p.line(s, `M146,${y}L${146 + w},${y}`, { w: 2.2, c: C.lgrey, amp: 0.6 }));
      p.text(s, 216, 128, ART.guide.note, { size: 15, c: C.pink, rot: -3 });
    },
  },
  live: {
    w: 320,
    draw(p, s) {
      const a = ART.live;
      p.shape(s, rr(18, 26, 104, 60, 14), { fill: C.white, w: 2.4 });
      p.text(s, 70, 64, a.from, { size: 22 });
      p.shape(s, rr(198, 26, 104, 60, 14), { fill: C.white, hatch: C.blue, gap: 8, w: 2.4 });
      p.text(s, 250, 64, a.to, { size: 22 });
      p.arrow(s, 128, 46, 160, 36, 192, 46, { w: 2.2 });
      p.arrow(s, 192, 70, 160, 80, 128, 70, { w: 2.2 });
      p.line(s, wavy(40, 116, 240, 7, 8), { w: 2.2, c: C.grey, raw: true });
      p.text(s, 160, 146, a.note, { size: 15, c: C.pink, rot: -2 });
    },
  },
  amm: {
    w: 320,
    draw(p, s) {
      const a = ART.amm;
      p.line(s, "M40,128L40,14", { w: 2.4 });
      p.line(s, "M40,128L300,128", { w: 2.4 });
      p.line(s, "M60,18C84,78 120,104 290,114", { w: 3 });
      p.shape(s, ell(122, 94, 6), { fill: C.ink, w: 0 });
      p.line(s, "M122,94L122,128", { w: 1.8, c: C.lgrey });
      p.line(s, "M40,94L122,94", { w: 1.8, c: C.lgrey });
      p.text(s, 210, 52, a.formula, { size: 22, c: C.pink, rot: -5 });
      p.text(s, 214, 78, a.note, { size: 16, c: C.grey, rot: -5 });
      p.text(s, 300, 146, a.x, { size: 15, c: C.grey });
      p.text(s, 28, 18, a.y, { size: 15, c: C.grey });
    },
  },
};

/** Draw a project's diagram; unknown ids draw nothing. Returns the viewBox width. */
export function buildProjectArt(svg: SVGSVGElement, id: string, seed: number): number {
  const art = PROJECT_ART[id];
  if (!art) return 320;
  art.draw(pen(svg, seed), svg);
  return art.w;
}

/** A strip of yellow tape, 86 × 26. */
export function buildTape(svg: SVGSVGElement) {
  pen(svg, 5).shape(svg, rr(2, 2, 82, 22, 3), { fill: "rgba(239,185,52,.28)", hatch: "rgba(239,185,52,.7)", gap: 6, w: 1.4, c: "rgba(160,120,30,.5)", amp: 0.8 });
}

/** The pencil in front of the composer, 26 × 26. */
export function buildPencil(svg: SVGSVGElement) {
  const p = pen(svg, 11);
  p.shape(svg, "M5,21L7,15L18,4L22,8L11,19Z", { fill: C.white, hatch: C.yellow, gap: 4, hw: 1.4, w: 2, amp: 0.3 });
  p.line(svg, "M5,21L7,15L11,19Z", { w: 2, amp: 0.2 });
}

/** A curved arrow from (x0, y0) to (x1, y1), bending through (cx, cy). */
export function buildArrow(svg: SVGSVGElement, seed: number, pts: [number, number, number, number, number, number], c = C.pink) {
  pen(svg, seed).arrow(svg, ...pts, { c, w: 2.6 });
}

/** A check mark in pink, 26 × 22. */
export function buildCheck(svg: SVGSVGElement, seed: number) {
  pen(svg, seed).line(svg, "M3,11L10,18L23,3", { c: C.pink, w: 3.4, amp: 0.4 });
}

/** Sun (light theme) and moon (dark theme) for the toggle; CSS shows one. 24 × 24. */
export function buildThemeIcon(svg: SVGSVGElement) {
  const p = pen(svg, 61);
  const sun = el("g", { class: "sun" }, svg);
  p.shape(sun, ell(12, 12, 5), { fill: C.yellow, w: 2, amp: 0.3 });
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    p.line(sun, `M${f1(12 + Math.cos(a) * 8)},${f1(12 + Math.sin(a) * 8)}L${f1(12 + Math.cos(a) * 11)},${f1(12 + Math.sin(a) * 11)}`, { w: 2, amp: 0.1 });
  }
  const moon = el("g", { class: "moon" }, svg);
  p.shape(moon, "M15.5,3.5C10,3.5 5.5,7.5 5.5,12.5C5.5,17.5 9.5,21 14.5,21C17,21 19.2,20 20.7,18.3C15.5,18.3 11.7,14.6 11.7,10C11.7,7.3 13.2,4.9 15.5,3.5Z", { fill: C.yellow, w: 2, amp: 0.3 });
  p.sparkle(moon, 19.5, 6, 2.6, C.ink);
}

/** A hand-drawn horizontal rule, the width of its svg. */
export function buildRule(svg: SVGSVGElement, width: number, seed = 21) {
  pen(svg, seed).line(svg, `M8,4L${width - 8},4`, { w: 2, c: C.lgrey, amp: 1.6, step: 18 });
}

/**
 * A pink loop drawn around a box of w × h, about 1.1 turns like a hand circling
 * something on paper, inside an svg of (w + 2m) × (h + 2m) with m = 38.
 */
export function buildCircle(svg: SVGSVGElement, w: number, h: number, seed: number) {
  const m = 38, rx = w / 2 + 22, ry = h / 2 + 22, cx = w / 2 + m, cy = h / 2 + m;
  const pts: number[][] = [];
  const n = 60, turns = 1.12, a0 = -2.2;
  for (let i = 0; i <= n; i++) {
    const t = a0 + (i / n) * turns * 6.283, k = 1 + 0.03 * Math.sin(i * 0.4 + seed) + (i / n) * 0.05;
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
  }
  el("path", { fill: "none", "stroke-linecap": "round", d: catmull(pts, false), stroke: C.pink, "stroke-width": 3.6, class: "ln" }, svg);
  return m;
}
