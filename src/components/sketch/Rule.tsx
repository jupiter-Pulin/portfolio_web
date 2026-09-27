"use client";

import { useEffect, useRef } from "react";
import { clear } from "@/lib/sketch";
import { buildRule } from "@/lib/sketchArt";

/** A hand-drawn line as wide as its box. */
export function Rule({ className, seed = 21 }: { className?: string; seed?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    let width = 0;
    const paint = () => {
      const w = Math.round(svg.getBoundingClientRect().width);
      if (!w || w === width) return;
      width = w;
      clear(svg);
      svg.setAttribute("viewBox", `0 0 ${w} 8`);
      buildRule(svg, w, seed);
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [seed]);
  return <svg ref={ref} className={className} aria-hidden="true" focusable="false" />;
}
