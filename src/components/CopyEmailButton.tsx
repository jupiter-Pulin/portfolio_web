"use client";

import { EMAIL } from "@/content/links";
import { copyToastMessage } from "@/lib/toast";
import { Sketch } from "./sketch/Sketch";
import { useToast } from "./Toast";

export function CopyEmailButton({
  label,
  // A text link in the page, a chip inside the ask drawer.
  className = "link-btn",
  sketch = false,
}: {
  label: string;
  className?: string;
  /** Draw a chip outline (the button then carries the `sk` class). */
  sketch?: boolean;
}) {
  const toast = useToast();

  const copy = async () => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(EMAIL);
      copied = true;
    } catch {
      copied = false;
    }
    toast(copyToastMessage(copied, EMAIL));
  };

  return (
    <button className={className} type="button" onClick={copy} title={`Copy ${EMAIL}`}>
      {sketch ? <Sketch r={16} w={1.8} hatch="var(--yellow)" gap={7} draw={false} /> : null}
      {label}
    </button>
  );
}
