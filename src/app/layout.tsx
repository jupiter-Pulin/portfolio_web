import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Nunito } from "next/font/google";
import "./globals.css";
import { AskProvider } from "@/components/AskDrawer";
import { ToastProvider } from "@/components/Toast";
import { HERO, SITE } from "@/content/copy";

// Three families, same weights and fallback stacks as the approved mock.
const display = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["800", "900"],
  display: "swap",
  fallback: ["ui-rounded", "system-ui", "sans-serif"],
});

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  fallback: ["ui-monospace", "Menlo", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: SITE.title,
  description: HERO.lede.split(" — ")[0],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        {/* Toast first: the ask drawer's "Copy email" chip raises one. */}
        <ToastProvider>
          <AskProvider>{children}</AskProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
