"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { drawIn, seedOf } from "@/lib/sketch";
import {
  artSize,
  buildArrow,
  buildCaseArt,
  buildCheck,
  buildPencil,
  buildProjectArt,
  CASE_ART,
  PROJECT_ART,
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
  | { kind: "project"; id: string }
  | { kind: "case"; art: string };

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
export function Drawing(props: Kind & { className?: string; style?: CSSProperties; draw?: number | false; dur?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const id = useId();
  const { className, style, draw = false, dur = 700 } = props;
  const key =
    props.kind === "project"
      ? `project:${props.id}`
      : props.kind === "case"
        ? `case:${props.art}`
        : props.kind === "arrow"
          ? `arrow:${props.pts.join(",")}`
          : props.kind;

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
        const { w, h } = buildProjectArt(svg, props.id, seed);
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        break;
      }
      case "case": {
        const { w, h } = buildCaseArt(svg, props.art, seed);
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
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

  const size = props.kind === "project" ? artSize(PROJECT_ART[props.id]) : props.kind === "case" ? artSize(CASE_ART[props.art]) : null;
  const viewBox = props.kind === "arrow" ? `0 0 ${props.w} ${props.h}` : size ? `0 0 ${size.w} ${size.h}` : VIEWBOX[props.kind];
  return <svg ref={ref} className={className} style={style} viewBox={viewBox} aria-hidden="true" focusable="false" />;
}
