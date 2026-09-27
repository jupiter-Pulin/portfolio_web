// "I'll take you there": scroll to a thing on the page and circle it in pink,
// like a note on paper, with a word beside it. Both fade out after a few seconds.
import { drawIn, el } from "./sketch.ts";
import { buildCircle } from "./sketchArt.ts";

export function circleAround(target: HTMLElement, label: string) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
  window.setTimeout(() => {
    document.querySelectorAll("[data-circle-anno]").forEach((n) => n.remove());
    const b = target.getBoundingClientRect();
    const x = b.left + window.scrollX, y = b.top + window.scrollY;
    const svg = el("svg", { "aria-hidden": "true", "data-circle-anno": "" });
    const m = 38;
    svg.setAttribute("width", String(b.width + m * 2));
    svg.setAttribute("height", String(b.height + m * 2));
    Object.assign(svg.style, { position: "absolute", left: `${x - m}px`, top: `${y - m}px`, zIndex: "20", pointerEvents: "none", overflow: "visible" });
    buildCircle(svg, b.width, b.height, Math.floor(Math.random() * 1000));
    document.body.append(svg);
    drawIn(svg, 0, 750);
    const here = document.createElement("div");
    here.setAttribute("data-circle-anno", "");
    here.setAttribute("aria-hidden", "true");
    here.textContent = label;
    Object.assign(here.style, { position: "absolute", left: `${x + b.width - 30}px`, top: `${y - 44}px`, zIndex: "21", color: "var(--pink)", font: "400 26px var(--hand)", rotate: "-8deg", pointerEvents: "none" });
    document.body.append(here);
    if (!still) here.animate([{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: 600, easing: "cubic-bezier(.3,1.6,.5,1)", fill: "backwards" });
    window.setTimeout(() => {
      for (const n of [svg, here]) {
        const fade = n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
        fade.onfinish = () => n.remove();
      }
    }, 4200);
  }, still ? 0 : 650);
}
