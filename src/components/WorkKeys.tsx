"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { keyAction } from "@/lib/workNav";

/** ← → walk the case pages, Esc leaves; keys are ignored while a field has focus. */
export function WorkKeys({ prevHref, nextHref }: { prevHref: string; nextHref: string }) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const action = keyAction(e.key, e.target as HTMLElement | null);
      if (!action) return;
      e.preventDefault();
      router.push(action === "prev" ? prevHref : action === "next" ? nextHref : "/");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, prevHref, nextHref]);

  return null;
}
