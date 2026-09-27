"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { clear, drawIn, el, wavy } from "@/lib/sketch";
import styles from "./Wavy.module.css";

/** Words underlined with a pink wave that draws itself in when it scrolls into view. */
export function Wavy({ children, c = "var(--pink)", delay = 300 }: { children: ReactNode; c?: string; delay?: number }) {
  const host = useRef<HTMLSpanElement>(null);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const span = host.current;
    const svg = ref.current;
    if (!span || !svg) return;
    let width = 0;
    const paint = () => {
      const w = span.getBoundingClientRect().width;
      if (!w || w === width) return;
      width = w;
      clear(svg);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", "14");
      el("path", { fill: "none", "stroke-linecap": "round", d: wavy(2, 7, w - 4, 3, Math.max(3, Math.round(w / 26))), stroke: c, "stroke-width": 3.4, class: "ln" }, svg);
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(span);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      drawIn(svg, delay, 450);
    });
    io.observe(span);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [c, delay]);

  return (
    <span className={styles.uw} ref={host}>
      {children}
      <svg ref={ref} aria-hidden="true" focusable="false" />
    </span>
  );
}
