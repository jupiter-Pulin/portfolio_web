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
  ink2: "var(--ink-2)",
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
/** A drawing and its viewBox size; `h` defaults to the cards' 156. */
export type Art = { w: number; h?: number; draw: ArtFn };

/** Dash a drawn line, or the outline of a drawn shape (for things verified on a fork, or off-chain). */
function dashed<T extends Element>(node: T, pattern = "6 7"): T {
  const ln = node.classList.contains("ln") ? node : node.querySelector(".ln");
  ln?.setAttribute("stroke-dasharray", pattern);
  return node;
}

/** One small diagram per project: the mechanism at a glance. Wide ones are 600 × 156, the rest 320 × 156; Platter's is taller. */
export const PROJECT_ART: Record<string, Art> = {
  platter: {
    w: 780,
    h: 290,
    draw(p, s) {
      const a = ART.platter;
      // The swap box: sell a token, buy vault shares, sign once.
      p.shape(s, rr(10, 20, 192, 232, 12), { fill: C.white, w: 2.4 });
      p.text(s, 24, 44, a.swap, { size: 17, a: "start" });
      p.shape(s, rr(22, 56, 168, 52, 7), { w: 2, amp: 0.8 });
      p.text(s, 32, 72, a.sell, { size: 13.5, c: C.grey, a: "start" });
      p.text(s, 32, 97, a.sellAmount, { size: 17, a: "start" });
      p.shape(s, rr(128, 76, 54, 22, 11), { w: 1.8, amp: 0.5 });
      p.text(s, 155, 92, a.sellToken, { size: 13 });
      p.shape(s, rr(22, 124, 168, 52, 7), { w: 2, amp: 0.8 });
      p.shape(s, ell(106, 116, 9), { fill: C.white, w: 2, amp: 0.3 });
      p.line(s, "M106,111L106,121M102,117L106,121L110,117", { w: 1.8, amp: 0.2 });
      p.text(s, 32, 140, a.buy, { size: 13.5, c: C.grey, a: "start" });
      p.text(s, 32, 165, a.buyAmount, { size: 17, a: "start" });
      p.shape(s, rr(106, 132, 76, 22, 11), { w: 1.8, amp: 0.5 });
      p.text(s, 144, 148, a.vault, { size: 12.5 });
      p.text(s, 182, 170, a.buyApy, { size: 12.5, c: C.mint, a: "end" });
      p.text(s, 24, 198, a.gasless, { size: 13.5, c: C.grey, a: "start" });
      p.shape(s, rr(150, 186, 32, 16, 8), { w: 1.8, amp: 0.3 });
      el("circle", { cx: 174, cy: 194, r: 5.5, fill: C.mint, class: "fill" }, s);
      p.shape(s, rr(22, 210, 168, 28, 14), { fill: C.white, hatch: C.pink, gap: 7, hw: 1.6, c: C.pink, w: 2.2, amp: 0.6 });
      p.text(s, 106, 230, a.sign, { size: 17 });
      p.text(s, 106, 276, a.note, { size: 16, c: C.pink, rot: -2 });
      // The vault beside it: APY, TVL and the hourly APY dots.
      p.shape(s, rr(212, 20, 208, 232, 12), { fill: C.white, w: 2.4 });
      p.shape(s, ell(232, 44, 10), { fill: C.white, hatch: C.blue, gap: 5, hw: 1.4, w: 2, amp: 0.3 });
      p.text(s, 248, 43, a.vault, { size: 15, a: "start" });
      p.text(s, 248, 59, a.protocol, { size: 13.5, c: C.grey, a: "start" });
      p.text(s, 408, 47, a.apy, { size: 22, c: C.mint, a: "end" });
      p.text(s, 408, 62, a.apyLabel, { size: 13.5, c: C.grey, a: "end" });
      p.shape(s, rr(224, 72, 184, 80, 6), { w: 1.5, c: C.lgrey, amp: 0.6 });
      el(
        "path",
        {
          d: "M232,132C244,130 252,126 262,128S276,90 284,96S296,124 306,122S330,118 342,120S360,84 368,92S384,126 400,130",
          fill: "none",
          stroke: C.mint,
          "stroke-width": 3.2,
          "stroke-dasharray": "0.1 5.5",
          "stroke-linecap": "round",
          class: "fill",
        },
        s,
      );
      a.cells.forEach(([label, value], i) => {
        const x = 224 + (i % 2) * 96, y = 160 + Math.floor(i / 2) * 46;
        p.shape(s, rr(x, y, 88, 40, 5), { w: 1.5, c: C.lgrey, amp: 0.5 });
        p.text(s, x + 8, y + 16, label, { size: 12.5, c: C.grey, a: "start" });
        p.text(s, x + 8, y + 33, value, { size: 14, a: "start" });
      });
      // The signed order leaves for the auction.
      p.shape(s, rr(428, 110, 22, 15, 2), { w: 1.8, amp: 0.2 });
      p.line(s, "M428,112L439,120L450,112", { w: 1.6, amp: 0.2 });
      p.arrow(s, 426, 140, 439, 140, 452, 140, { w: 2.2, hl: 8 });
      p.text(s, 439, 162, a.order, { size: 13.5, c: C.grey });
      // Off-chain: the auctioneer takes the solvers' bids and picks one within the deadline.
      dashed(p.shape(s, rr(458, 20, 210, 232, 12), { w: 1.6, c: C.grey, amp: 0.8 }));
      p.text(s, 470, 40, a.offChain, { size: 13.5, c: C.grey, a: "start" });
      p.shape(s, ell(490, 66, 13), { w: 2, amp: 0.3 });
      p.line(s, "M490,66L490,57M490,66L496,69", { w: 1.8, amp: 0.1 });
      p.text(s, 507, 71, a.clock, { size: 13.5, c: C.grey, a: "start" });
      p.shape(s, ell(563, 68, 12), { fill: C.white, w: 2.2, amp: 0.3 });
      p.line(s, "M540,98Q563,78 586,98", { w: 2.2, amp: 0.4 });
      p.line(s, "M590,92L608,70", { w: 2.2, amp: 0.2 });
      p.shape(s, rr(602, 56, 20, 10, 2), { fill: C.white, w: 2, amp: 0.2 }).setAttribute("transform", "rotate(-42 612 61)");
      p.shape(s, rr(515, 98, 96, 32, 4), { fill: C.white, w: 2.2, amp: 0.6 });
      p.text(s, 563, 120, a.auction, { size: 16 });
      p.line(s, "M489,160L535,131M539,160L555,131M589,160L571,131M639,160L591,131", { w: 1.6, c: C.grey, amp: 0.3 });
      a.bids.forEach(([who, bid], i) => {
        const x = 468 + i * 50;
        const won = i === 0;
        p.shape(s, rr(x, 160, 42, 42, 6), won ? { fill: C.white, hatch: C.mint, gap: 6, hw: 1.5, c: C.mint, w: 2.2, amp: 0.4 } : { fill: C.white, w: 2, amp: 0.4 });
        p.text(s, x + 21, 178, who, { size: 12.5 });
        p.text(s, x + 21, 195, bid, { size: 12, c: C.grey });
      });
      p.text(s, 489, 222, a.wins, { size: 14, c: C.mint });
      // On-chain: the winning bid settles in one transaction, for at least the signed minimum.
      p.arrow(s, 672, 109, 683, 109, 694, 109, { w: 2.2, hl: 8 });
      p.text(s, 700, 40, a.chain, { size: 13.5, c: C.grey, a: "start" });
      p.shape(s, rr(700, 50, 70, 30, 4), { w: 2, amp: 0.4 });
      p.line(s, "M735,80L735,94", { w: 2, amp: 0.1 });
      p.shape(s, rr(700, 94, 70, 30, 4), { fill: C.white, hatch: C.yellow, gap: 6, hw: 1.5, w: 2.2, amp: 0.4 });
      p.text(s, 735, 114, a.tx, { size: 14 });
      p.line(s, "M735,124L735,138", { w: 2, amp: 0.1 });
      dashed(p.shape(s, rr(700, 138, 70, 30, 4), { w: 1.6, c: C.grey, amp: 0.4 }));
      p.text(s, 735, 192, a.floor, { size: 14, c: C.pink, rot: -3 });
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

const LANES = [110, 325, 540, 755, 970];

/** Drawings that sit under a case page, full width, keyed by a record's `figures[].art` or `architecture.art`. */
export const CASE_ART: Record<string, Art> = {
  // The card's drawing, larger.
  "platter-fill": PROJECT_ART.platter,
  // Who holds the money at each step of one gasless settlement.
  "platter-settle": {
    w: 1080,
    h: 630,
    draw(p, s) {
      const a = ART.platterSettle;
      a.lanes.forEach(([name, sub], i) => {
        const x = LANES[i];
        p.shape(s, rr(x - 85, 20, 170, 64, 8), { fill: C.white, w: 2.4, amp: 0.8 });
        p.text(s, x, 48, name, { size: 19 });
        p.text(s, x, 70, sub, { size: 15, c: C.grey });
        dashed(p.line(s, `M${x},90L${x},${i === 2 ? 504 : 490}`, { w: 1.6, c: C.lgrey, amp: 0.4 }), "3 7");
      });
      const step = (y: number, from: number, to: number, c: string, label: string, lx: number, approval = false) => {
        const dir = to > from ? 1 : -1;
        const x0 = LANES[from] + 4 * dir, x1 = LANES[to] - 6 * dir;
        const g = p.arrow(s, x0, y, (x0 + x1) / 2, y, x1, y, { c, w: 2.4, hl: 10, amp: 0.6 });
        if (approval) dashed(g);
        p.text(s, lx, y - 11, label, { size: 16.5, c: C.ink2 });
      };
      const t = a.steps;
      step(124, 0, 1, C.grey, t.approve, 217, true);
      step(174, 0, 1, C.mint, t.pull, 217);
      step(174, 1, 2, C.mint, t.into, 432);
      step(224, 2, 3, C.mint, t.send, 647);
      step(274, 3, 4, C.mint, t.swap, 862);
      step(324, 4, 3, C.blue, t.back, 862);
      step(374, 3, 2, C.blue, t.fees, 647);
      step(424, 3, 0, C.blue, t.surplus, 647);
      step(474, 2, 0, C.blue, t.pay, 217);
      p.shape(s, rr(430, 508, 220, 62, 8), { fill: C.white, c: C.blue, w: 2.4, amp: 0.6 });
      p.text(s, 540, 534, a.keep[0], { size: 18 });
      p.text(s, 540, 556, a.keep[1], { size: 15, c: C.grey });
      [C.mint, C.blue, C.grey].forEach((c, i) => {
        const x = 40 + i * 220;
        const ln = p.line(s, `M${x},606L${x + 30},606`, { c, w: 2.6, amp: 0.2 });
        if (i === 2) dashed(ln);
        p.text(s, x + 40, 611, a.legend[i], { size: 15, c: C.grey, a: "start" });
      });
    },
  },
  // As built: solid boxes are live, dashed ones are verified on a mainnet fork.
  "platter-arch": {
    w: 1080,
    h: 556,
    draw(p, s) {
      const a = ART.platterArch;
      const box = (x: number, y: number, w: number, h: number, title: string, subs: readonly string[], subSize = 14) => {
        const g = p.shape(s, rr(x, y, w, h, 8), { fill: C.white, w: 2.2, amp: 0.6 });
        p.text(s, x + 14, y + 26, title, { size: 17, a: "start" });
        subs.forEach((line, i) => p.text(s, x + 14, y + 47 + i * 19, line, { size: subSize, c: C.grey, a: "start" }));
        return g;
      };
      ([[20, 230], [280, 520], [830, 230]] as const).forEach(([x, w], i) => {
        p.shape(s, rr(x, 20, w, 480, 14), { w: 1.4, c: C.lgrey, amp: 1 });
        p.text(s, x + 18, 48, a.zones[i], { size: 15, c: C.grey, a: "start" });
      });
      box(40, 66, 190, 70, a.web[0], [a.web[1]]);
      box(40, 156, 190, 70, a.wallet[0], [a.wallet[1]]);
      box(300, 66, 480, 62, a.edge[0], [a.edge[1]]);
      box(300, 148, 150, 62, a.site[0], [a.site[1]]);
      box(300, 226, 150, 80, a.db[0], [a.db[1], a.db[2]]);
      p.shape(s, rr(470, 148, 310, 158, 8), { fill: C.white, w: 2.2, amp: 0.6 });
      p.text(s, 484, 174, a.api, { size: 17, a: "start" });
      a.apiJobs.forEach((job, i) => p.text(s, 490, 198 + i * 21, `· ${job}`, { size: 14, c: C.ink2, a: "start" }));
      dashed(p.shape(s, rr(300, 326, 480, 150, 10), { w: 1.8, c: C.grey, amp: 0.8 }));
      p.text(s, 318, 352, a.cow, { size: 14, c: C.grey, a: "start" });
      a.cowParts.forEach((part, i) => {
        const x = 316 + i * 116;
        p.shape(s, rr(x, 378, 92, 44, 8), { fill: C.white, w: 2, amp: 0.5 });
        p.text(s, x + 46, 405, part, { size: 14 });
        if (i < a.cowParts.length - 1) p.arrow(s, x + 94, 400, x + 104, 400, x + 114, 400, { w: 1.8, hl: 6, amp: 0.2 });
      });
      box(850, 66, 190, 70, a.chain[0], [a.chain[1]]);
      dashed(box(850, 154, 190, 70, a.contracts[0], [a.contracts[1]]));
      box(850, 242, 190, 70, a.aggs[0], [a.aggs[1]], 13);
      box(850, 330, 190, 70, a.data[0], [a.data[1]]);
      p.arrow(s, 232, 100, 266, 92, 298, 96, { w: 2, hl: 8 });
      p.arrow(s, 375, 130, 377, 138, 375, 146, { w: 2, hl: 7, amp: 0.2 });
      p.arrow(s, 625, 130, 627, 138, 625, 146, { w: 2, hl: 7, amp: 0.2 });
      p.arrow(s, 470, 250, 461, 256, 452, 262, { w: 2, hl: 7, amp: 0.2 });
      p.arrow(s, 540, 308, 470, 340, 380, 376, { w: 2, hl: 8 });
      p.arrow(s, 782, 180, 816, 150, 848, 112, { w: 2, hl: 8 });
      p.arrow(s, 782, 240, 816, 256, 848, 272, { w: 2, hl: 8 });
      p.arrow(s, 782, 380, 812, 300, 848, 202, { w: 2, hl: 8 });
      p.line(s, "M40,532L72,532", { w: 2.2, amp: 0.2 });
      p.text(s, 82, 537, a.legend[0], { size: 15, c: C.grey, a: "start" });
      dashed(p.line(s, "M170,532L202,532", { w: 2.2, c: C.grey, amp: 0.2 }));
      p.text(s, 212, 537, a.legend[1], { size: 15, c: C.grey, a: "start" });
    },
  },
};

/** The viewBox size of a drawing; an unknown one is the small card size. */
export const artSize = (art: Art | undefined) => ({ w: art?.w ?? 320, h: art?.h ?? 156 });

function build(svg: SVGSVGElement, art: Art | undefined, seed: number) {
  if (art) art.draw(pen(svg, seed), svg);
  return artSize(art);
}

/** Draw a project's diagram; unknown ids draw nothing. Returns the viewBox size. */
export const buildProjectArt = (svg: SVGSVGElement, id: string, seed: number) => build(svg, PROJECT_ART[id], seed);

/** Draw one of the case pages' larger drawings; unknown keys draw nothing. Returns the viewBox size. */
export const buildCaseArt = (svg: SVGSVGElement, key: string, seed: number) => build(svg, CASE_ART[key], seed);

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
