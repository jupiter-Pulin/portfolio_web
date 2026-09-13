import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SelectedWorkStrip } from "@/components/SelectedWorkStrip";

export default function Home() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <SelectedWorkStrip />
      </main>
      <Footer />
    </>
  );
}
