import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LatestNotes } from "@/components/LatestNotes";
import { WorkCards } from "@/components/WorkCards";

export default function Home() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <WorkCards />
        <LatestNotes />
      </main>
      <Footer />
    </>
  );
}
