"use client";

import { useEffect, useState } from "react";
import { HOME } from "@/content/copy";
import { Drawing } from "./sketch/Drawing";
import { Sketch } from "./sketch/Sketch";

type Mode = "light" | "dark";

const STORAGE_KEY = "theme";
const current = (): Mode => (document.documentElement.dataset.mode === "dark" ? "dark" : "light");

/**
 * Sun or moon. The page follows the system until the reader picks; the pick is
 * remembered (the inline script in layout.tsx applies it before the first paint).
 * The new theme spreads from the button where view transitions exist.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    const root = document.documentElement;
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      if (!root.dataset.theme) root.dataset.mode = system.matches ? "dark" : "light";
      setMode(current());
    };
    sync();
    system.addEventListener("change", sync);
    return () => system.removeEventListener("change", sync);
  }, []);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement;
    const next: Mode = current() === "dark" ? "light" : "dark";
    const apply = () => {
      root.dataset.theme = next;
      root.dataset.mode = next;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // private windows: the pick lasts for this page only
      }
      setMode(next);
    };
    window.dispatchEvent(new CustomEvent("assistant:wave"));
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (still || !doc.startViewTransition) return apply();
    const b = e.currentTarget.getBoundingClientRect();
    root.style.setProperty("--vx", `${b.left + b.width / 2}px`);
    root.style.setProperty("--vy", `${b.top + b.height / 2}px`);
    doc.startViewTransition(apply);
  };

  const label = mode === "dark" ? HOME.theme.toLight : HOME.theme.toDark;
  return (
    <button className={`icon-btn sk ${className ?? ""}`} type="button" onClick={toggle} aria-label={label} title={label}>
      <Sketch shape="circle" w={2} draw={false} />
      <Drawing kind="theme" className="theme-ic" />
    </button>
  );
}
