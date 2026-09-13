"use client";

import { EMAIL } from "@/content/links";
import { copyToastMessage } from "@/lib/toast";
import { useToast } from "./Toast";

export function CopyEmailButton({ label }: { label: string }) {
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
    <button className="link-btn" type="button" onClick={copy} title={`Copy ${EMAIL}`}>
      {label}
    </button>
  );
}
