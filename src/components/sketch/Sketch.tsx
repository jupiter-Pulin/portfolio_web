"use client";

import { useEffect, useId, useRef } from "react";
import { bubblePath, clear, drawIn, el, ell, pen, rr, seedOf, type BubbleSide } from "@/lib/sketch";

// Room around the box for the wobble and for a bubble's tail.
const PAD = 44;
const LINE = { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };

export type SketchProps = {
  /** Corner radius of a rect. */
  r?: number;
  /** Stroke width and colour. */
  w?: number;
  c?: string;
  fill?: string;
  /** Diagonal hatching over the whole shape. */
  hatch?: string;
  gap?: number;
  hw?: number;
  /** Hatching only across the top, this tall. */
  band?: number;
  bandColor?: string;
  shape?: "rect" | "circle" | BubbleSide;
  /** Bubble tail options, see bubblePath. */
  tail?: "top";
  tx?: number;
  amp?: number;
  /** Draw the line in when it first scrolls into view, after this many ms; false draws it at once. */
  draw?: number | false;
  dur?: number;
};

/**
 * A hand-drawn outline behind its parent, which must carry the `sk` class. It is
 * an <svg> the component owns and fills imperatively, redrawn whenever the parent
 * changes size; React renders nothing inside it. Seeded by useId, so a given box
 * wobbles the same way on every visit.
 */
export function Sketch({
  r = 14,
  w = 2.4,
  c = "var(--ink)",
  fill,
  hatch,
  gap = 9,
  hw = 2,
  band,
  bandColor,
  shape = "rect",
  tail,
  tx,
  amp,
  draw = 0,
  dur = 600,
}: SketchProps) {
  const ref = useRef<SVGSVGElement>(null);
  const id = useId();

  useEffect(() => {
    const svg = ref.current;
    const host = svg?.parentElement;
    if (!svg || !host) return;
    const seed = seedOf(id);
    let size = "";

    const paint = () => {
      const bw = host.offsetWidth;
      const bh = host.offsetHeight;
      if (!bw || !bh) return;
      const key = `${bw}x${bh}`;
      if (key === size) return;
      size = key;
      clear(svg);
      svg.setAttribute("width", String(bw + PAD * 2));
      svg.setAttribute("height", String(bh + PAD * 2));
      svg.setAttribute("viewBox", `${-PAD} ${-PAD} ${bw + PAD * 2} ${bh + PAD * 2}`);
      svg.style.left = `${-PAD}px`;
      svg.style.top = `${-PAD}px`;
      const p = pen(svg, seed);
      const i = 1.4;
      const d =
        shape === "circle"
          ? ell(bw / 2, bh / 2, bw / 2 - i, bh / 2 - i)
          : shape === "rect"
            ? rr(i, i, bw - 2 * i, bh - 2 * i, r)
            : bubblePath(bw, bh, shape, { tail, tx });
      const wd = p.wob(d, { amp: amp ?? (bw > 300 ? 1.8 : 1.1), closed: true });
      if (fill) el("path", { d: wd, fill, class: "fill" }, svg);
      if (hatch) p.hatch(svg, wd, hatch, { gap, hw });
      if (band && bandColor) p.hatchBand(svg, wd, bandColor, { x: -PAD, y: -PAD, w: bw + PAD * 2, h: PAD + band }, { gap: 8, hw: 2.2 });
      el("path", { ...LINE, d: wd, stroke: c, "stroke-width": w, class: "ln" }, svg);
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(host);

    let io: IntersectionObserver | undefined;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (draw !== false && !still) {
      svg.style.visibility = "hidden";
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io?.disconnect();
          svg.style.visibility = "";
          drawIn(svg, draw, dur);
        },
        { threshold: 0.1 },
      );
      io.observe(host);
    }
    return () => {
      ro.disconnect();
      io?.disconnect();
      svg.style.visibility = "";
    };
  }, [id, r, w, c, fill, hatch, gap, hw, band, bandColor, shape, tail, tx, amp, draw, dur]);

  return <svg ref={ref} className="sk-svg" aria-hidden="true" focusable="false" />;
}
