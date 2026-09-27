import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WorkGallery } from "@/components/WorkGallery";
import { SITE } from "@/content/copy";

export const metadata: Metadata = { title: `${SITE.workTitle} · ${SITE.title}` };

export default function WorkPage() {
  return (
    <>
      <Header />
      <main>
        <WorkGallery />
      </main>
      <Footer />
    </>
  );
}
