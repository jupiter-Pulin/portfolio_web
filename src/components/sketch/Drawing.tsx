"use client";

import { useEffect, useId, useRef } from "react";
import { drawIn, seedOf } from "@/lib/sketch";
import {
  buildArrow,
  buildCheck,
  buildPencil,
  buildProjectArt,
  buildRobotHead,
  buildTape,
  buildThemeIcon,
  ROBOT_HEAD_VIEWBOX,
} from "@/lib/sketchArt";

type Kind =
  | { kind: "tape" }
  | { kind: "pencil" }
  | { kind: "check" }
  | { kind: "theme" }
  | { kind: "robot-head" }
  | { kind: "arrow"; w: number; h: number; pts: [number, number, number, number, number, number] }
  | { kind: "project"; id: string };

const VIEWBOX: Record<string, string> = {
  tape: "0 0 86 26",
  pencil: "0 0 26 26",
  check: "0 0 26 22",
  theme: "0 0 24 24",
  "robot-head": ROBOT_HEAD_VIEWBOX,
};

/**
 * One of the site's small drawings, built once in the browser. `draw` draws the
 * lines in when the drawing first scrolls into view (after that many ms);
 * false shows it at once.
 */
export function Drawing(props: Kind & { className?: string; draw?: number | false; dur?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const id = useId();
  const { className, draw = false, dur = 700 } = props;
  const key = props.kind === "project" ? `project:${props.id}` : props.kind === "arrow" ? `arrow:${props.pts.join(",")}` : props.kind;

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const seed = seedOf(id);
    switch (props.kind) {
      case "tape":
        buildTape(svg);
        break;
      case "pencil":
        buildPencil(svg);
        break;
      case "check":
        buildCheck(svg, seed);
        break;
      case "theme":
        buildThemeIcon(svg);
        break;
      case "robot-head":
        buildRobotHead(svg);
        break;
      case "arrow":
        buildArrow(svg, seed, props.pts);
        break;
      case "project": {
        const w = buildProjectArt(svg, props.id, seed);
        svg.setAttribute("viewBox", `0 0 ${w} 156`);
        break;
      }
    }
    if (draw === false) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return;
    svg.style.visibility = "hidden";
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      svg.style.visibility = "";
      drawIn(svg, draw, dur);
    });
    io.observe(svg);
    return () => {
      io.disconnect();
      svg.style.visibility = "";
    };
    // `key` stands for the props that change the drawing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, key, draw, dur]);

  const viewBox =
    props.kind === "arrow" ? `0 0 ${props.w} ${props.h}` : props.kind === "project" ? "0 0 320 156" : VIEWBOX[props.kind];
  return <svg ref={ref} className={className} viewBox={viewBox} aria-hidden="true" focusable="false" />;
}
