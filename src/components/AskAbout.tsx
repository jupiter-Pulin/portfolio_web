"use client";

import { HOME } from "@/content/copy";
import { useAsk } from "./AskDrawer";

/** "ask about it": the assistant, opened already scoped to one project. */
export function AskAbout({ id, className }: { id: string; className?: string }) {
  const { openAsk } = useAsk();
  return (
    <button className={className} type="button" data-scope={id} onClick={() => openAsk(id)}>
      {HOME.askAbout}
    </button>
  );
}
