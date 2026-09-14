"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { keyAction } from "@/lib/workNav";
import { useAsk } from "./AskDrawer";

/** ← → walk the case pages, Esc leaves; keys are ignored while a field has focus.
    An open guide keeps the keyboard to itself — Esc closes it and nothing navigates. */
export function WorkKeys({ prevHref, nextHref }: { prevHref: string; nextHref: string }) {
  const router = useRouter();
  const { isOpen } = useAsk();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const action = keyAction(e.key, e.target as HTMLElement | null, { askOpen: isOpen });
      if (!action) return;
      e.preventDefault();
      router.push(action === "prev" ? prevHref : action === "next" ? nextHref : "/");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, prevHref, nextHref, isOpen]);

  return null;
}
