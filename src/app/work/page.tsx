import type { Metadata } from "next";
import { WorkPlaceholder } from "@/components/WorkPlaceholder";
import { SITE } from "@/content/copy";

export const metadata: Metadata = { title: SITE.workTitle };

export default function WorkPage() {
  return <WorkPlaceholder />;
}
