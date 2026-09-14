import type { Metadata } from "next";
import { WorkGallery } from "@/components/WorkGallery";
import { SITE } from "@/content/copy";

export const metadata: Metadata = { title: SITE.workTitle };

export default function WorkPage() {
  return <WorkGallery />;
}
