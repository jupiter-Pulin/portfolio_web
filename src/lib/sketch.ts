// The pen behind the site's hand-drawn look — the same one as Nolan's explainer
// videos: a path is sampled, pushed along its normal by two slow sines and joined
// back with Catmull-Rom, so every line wobbles like a hand drew it. Hatching is
// diagonal lines clipped to a shape. Colours are CSS variables, so both themes
// redraw nothing. Browser-only: measuring a path needs the DOM.
const NS = "http://www.w3.org/2000/svg";

export const f1 = (v: number) => Math.round(v * 10) / 10;
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Seeded randomness: the same seed wobbles the same way on every visit. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable seed from any string, e.g. a React useId(). */
export function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ---- path shapes (plain strings, no DOM) ----
export function rr(x: number, y: number, w: number, h: number, r = 12): string {
  r = Math.min(r, w / 2, h / 2);
  return `M${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x + r}Q${x},${y + h} ${x},${y + h - r}V${y + r}Q${x},${y} ${x + r},${y}Z`;
}
export const ell = (cx: number, cy: number, rx: number, ry = rx) =>
  `M${cx - rx},${cy}A${rx},${ry} 0 1,0 ${cx + rx},${cy}A${rx},${ry} 0 1,0 ${cx - rx},${cy}Z`;
export function wavy(x: number, y: number, w: number, amp: number, n: number): string {
  let d = `M${x},${y}`;
  const s = w / (2 * n);
  for (let i = 0; i < 2 * n; i++) d += `Q${f1(x + (i + 0.5) * s)},${f1(y + (i % 2 ? amp : -amp))} ${f1(x + (i + 1) * s)},${y}`;
  return d;
}
export function catmull(pts: number[][], closed: boolean): string {
  const n = pts.length;
  const Q = (i: number) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = Q(i - 1), b = Q(i), c = Q(i + 1), e = Q(i + 2);
    d += `C${f1(b[0] + (c[0] - a[0]) / 6)},${f1(b[1] + (c[1] - a[1]) / 6)} ${f1(c[0] - (e[0] - b[0]) / 6)},${f1(c[1] - (e[1] - b[1]) / 6)} ${f1(c[0])},${f1(c[1])}`;
  }
  return closed ? d + "Z" : d;
}

export type BubbleSide = "left" | "right" | "down";

/**
 * A speech bubble w × h. "left" / "right": the tail sticks out of that side near
 * the bottom (or near the top with tail "top"); "down": out of the bottom edge,
 * its tip at tx × width, 38px below.
 */
export function bubblePath(w: number, h: number, side: BubbleSide, opts: { tail?: "top"; tx?: number } = {}): string {
  const r = 16;
  const hb = Math.min(h - r - 4, 46);
  if (side === "down") {
    const tip = w * (opts.tx ?? 0.8);
    const b1 = clamp(tip - 10, r + 32, w - r - 2);
    const b0 = b1 - 30;
    return `M${r},0H${w - r}Q${w},0 ${w},${r}V${h - r}Q${w},${h} ${w - r},${h}H${f1(b1)}L${f1(tip)},${h + 38}L${f1(b0)},${h}H${r}Q0,${h} 0,${h - r}V${r}Q0,0 ${r},0Z`;
  }
  if (side === "left" && opts.tail === "top" && h > 100) {
    return `M${r},0H${w - r}Q${w},0 ${w},${r}V${h - r}Q${w},${h} ${w - r},${h}H${r}Q0,${h} 0,${h - r}V92L-24,84L0,60V${r}Q0,0 ${r},0Z`;
  }
  if (side === "left") {
    return `M${r},0H${w - r}Q${w},0 ${w},${r}V${h - r}Q${w},${h} ${w - r},${h}H${r}Q0,${h} 0,${h - r}V${h - 18}L-22,${h - 2}L0,${h - hb}V${r}Q0,0 ${r},0Z`;
  }
  return `M${r},0H${w - r}Q${w},0 ${w},${r}V${h - hb}L${w + 20},${h - 2}L${w},${h - 18}V${h - r}Q${w},${h} ${w - r},${h}H${r}Q0,${h} 0,${h - r}V${r}Q0,0 ${r},0Z`;
}

// ---- drawing into an <svg> ----
let measurePath: SVGPathElement | null = null;
function measure(): SVGPathElement {
  if (measurePath?.isConnected) return measurePath;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svg.style.pointerEvents = "none";
  measurePath = document.createElementNS(NS, "path");
  svg.appendChild(measurePath);
  document.body.appendChild(svg);
  return measurePath;
}

type Attrs = Record<string, string | number>;

/** An SVG element. fill / stroke that are CSS variables go to style: attributes cannot hold var(). */
export function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs | null, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if ((k === "fill" || k === "stroke") && typeof v === "string" && v.startsWith("var(")) e.style.setProperty(k, v);
      else e.setAttribute(k, String(v));
    }
  }
  if (parent) parent.appendChild(e);
  return e;
}

const LINE = { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
let uid = 0;

export type LineOpts = { c?: string; w?: number; amp?: number; step?: number; raw?: boolean };
export type ShapeOpts = LineOpts & { fill?: string; hatch?: string; gap?: number; hw?: number; angle?: number };
export type TextOpts = { size?: number; c?: string; a?: "start" | "middle" | "end"; rot?: number };

/** One seeded pen drawing into one <svg>; hatch clip paths live in that svg's own <defs>. */
export function pen(svg: SVGSVGElement, seed: number) {
  const rnd = mulberry32(seed);
  const R = (a: number, b: number) => a + (b - a) * rnd();
  const defs = (svg.querySelector(":scope > defs") as SVGDefsElement | null) ?? el("defs", null, svg);

  function wob(d: string, o: { amp?: number; step?: number; closed?: boolean } = {}): string {
    const amp = o.amp ?? 1.6, step = o.step ?? 11, closed = !!o.closed;
    const mp = measure();
    mp.setAttribute("d", d);
    const L = mp.getTotalLength();
    if (!(L > 3)) return d;
    const n = Math.max(closed ? 10 : 2, Math.round(L / step));
    const a = amp * Math.min(1, 0.35 + L / 240);
    const k1 = closed ? Math.round(R(1, 3)) : R(0.5, 1.4);
    const k2 = closed ? Math.round(R(3, 5)) : R(1.8, 3.2);
    const p1 = R(0, 6.283), p2 = R(0, 6.283);
    const pts: number[][] = [];
    for (let i = 0; i <= (closed ? n - 1 : n); i++) {
      const s = (L * i) / n, p = mp.getPointAtLength(s);
      const pa = mp.getPointAtLength(Math.max(0, s - 1.5)), pb = mp.getPointAtLength(Math.min(L, s + 1.5));
      let tx = pb.x - pa.x, ty = pb.y - pa.y;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const u = i / n, off = a * (0.65 * Math.sin(u * k1 * 6.283 + p1) + 0.35 * Math.sin(u * k2 * 6.283 + p2));
      pts.push([p.x - ty * off, p.y + tx * off]);
    }
    return catmull(pts, closed);
  }

  function hatch(g: Element, wd: string, color: string, o: ShapeOpts = {}): SVGGElement {
    const mp = measure();
    mp.setAttribute("d", wd);
    const bb = mp.getBBox();
    const id = `skh${seed.toString(36)}-${uid++}`;
    el("path", { d: wd }, el("clipPath", { id }, defs));
    const gap = o.gap ?? 11, ang = ((o.angle ?? -52) * Math.PI) / 180;
    const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, rad = Math.hypot(bb.width, bb.height) / 2 + 4;
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    let d = "";
    for (let s = -rad + gap / 2; s <= rad; s += gap) {
      const j0 = R(-1.3, 1.3), j1 = R(-1.3, 1.3);
      d += `M${f1(cx + nx * (s + j0) - dx * rad)},${f1(cy + ny * (s + j0) - dy * rad)}L${f1(cx + nx * (s + j1) + dx * rad)},${f1(cy + ny * (s + j1) + dy * rad)}`;
    }
    const hg = el("g", { "clip-path": `url(#${id})`, class: "sk-hatch" }, g);
    el("path", { d, fill: "none", stroke: color, "stroke-width": o.hw ?? 2.2, "stroke-linecap": "round", class: "ht" }, hg);
    return hg;
  }

  /** A line (several subpaths are wobbled one by one). */
  function line(parent: Element, d: string, o: LineOpts = {}) {
    const wd = o.raw ? d : d.split(/(?=M)/).map((s) => wob(s, o)).join("");
    return el("path", { ...LINE, d: wd, stroke: o.c ?? "var(--ink)", "stroke-width": o.w ?? 3.6, class: "ln" }, parent);
  }

  /** A closed shape: fill, then hatch, then the outline on top. */
  function shape(parent: Element, d: string, o: ShapeOpts = {}) {
    const g = el("g", { class: "sh" }, parent);
    const wd = o.raw ? d : wob(d, { amp: o.amp ?? 1.8, step: o.step, closed: true });
    if (o.fill) el("path", { d: wd, fill: o.fill, class: "fill" }, g);
    if (o.hatch) hatch(g, wd, o.hatch, o);
    if (o.w !== 0) el("path", { ...LINE, d: wd, stroke: o.c ?? "var(--ink)", "stroke-width": o.w ?? 3.6, class: "ln" }, g);
    return g;
  }

  function text(parent: Element, x: number, y: number, s: string, o: TextOpts = {}) {
    const t = el(
      "text",
      { x: f1(x), y: f1(y), "font-size": o.size ?? 18, fill: o.c ?? "var(--ink)", "text-anchor": o.a ?? "middle", class: "tx" },
      parent,
    );
    t.style.fontFamily = "var(--hand)";
    if (o.rot) t.setAttribute("transform", `rotate(${o.rot} ${f1(x)} ${f1(y)})`);
    t.textContent = s;
    return t;
  }

  /** A quadratic arrow: start, control point, end. */
  function arrow(parent: Element, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, o: LineOpts & { hl?: number } = {}) {
    const g = el("g", null, parent);
    const a = Math.atan2(y1 - cy, x1 - cx), L = o.hl ?? 12, w = o.w ?? 2.6;
    line(g, `M${x0},${y0}Q${cx},${cy} ${x1},${y1}`, { c: o.c, w, amp: o.amp ?? 1 });
    line(g, `M${f1(x1 - L * Math.cos(a - 0.5))},${f1(y1 - L * Math.sin(a - 0.5))}L${x1},${y1}L${f1(x1 - L * Math.cos(a + 0.5))},${f1(y1 - L * Math.sin(a + 0.5))}`, { c: o.c, w, amp: 0.3 });
    return g;
  }

  /** Hatch only the part of a shape inside a rectangle, e.g. a coloured band across a card's top. */
  function hatchBand(parent: Element, wd: string, color: string, box: { x: number; y: number; w: number; h: number }, o: ShapeOpts = {}) {
    const id = `skb${seed.toString(36)}-${uid++}`;
    el("rect", { x: box.x, y: box.y, width: box.w, height: box.h }, el("clipPath", { id }, defs));
    return hatch(el("g", { "clip-path": `url(#${id})` }, parent), wd, color, o);
  }

  function sparkle(parent: Element, x: number, y: number, r: number, c: string) {
    const q = r * 0.18;
    return shape(parent, `M${x},${y - r}Q${x + q},${y - q} ${x + r},${y}Q${x + q},${y + q} ${x},${y + r}Q${x - q},${y + q} ${x - r},${y}Q${x - q},${y - q} ${x},${y - r}Z`, { fill: c, w: 2.2, amp: 0.4 });
  }

  return { R, wob, hatch, hatchBand, line, shape, text, arrow, sparkle };
}

export type Pen = ReturnType<typeof pen>;

/** Empty an svg, keeping nothing (its old clip paths go with it). */
export function clear(svg: SVGSVGElement) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

/**
 * Draw the lines of `root` in, one hand at a constant speed: time is shared out
 * by length. Fills fade in with their outline, hatching last. No-op when the
 * visitor prefers reduced motion.
 */
export function drawIn(root: Element | null | undefined, delay = 0, dur = 700) {
  if (!root || typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const lns = [...root.querySelectorAll<SVGPathElement>(".ln")];
  const lens = lns.map((p) => {
    try {
      return p.getTotalLength();
    } catch {
      return 0;
    }
  });
  const tot = lens.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  lns.forEach((p, i) => {
    const L = lens[i] + 2, t0 = delay + (dur * acc) / tot, d = Math.max(40, (dur * lens[i]) / tot);
    acc += lens[i];
    p.style.strokeDasharray = `${L} ${L}`;
    const an = p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: d, delay: t0, easing: "cubic-bezier(.45,.05,.4,1)", fill: "backwards" });
    an.onfinish = () => {
      p.style.strokeDasharray = "";
    };
  });
  root.querySelectorAll(".fill").forEach((f) => f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur * 0.5, delay, fill: "backwards" }));
  root.querySelectorAll(".sk-hatch").forEach((h) => {
    if (h.closest(".chip, .hover-hatch")) return;
    h.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: delay + dur * 0.75, fill: "backwards" });
  });
  root.querySelectorAll(".tx").forEach((t) => t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: delay + dur * 0.5, fill: "backwards" }));
}
