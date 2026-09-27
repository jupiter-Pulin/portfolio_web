import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Patrick_Hand } from "next/font/google";
import "./globals.css";
import { AskProvider } from "@/components/AskDrawer";
import { ToastProvider } from "@/components/Toast";
import { SITE } from "@/content/copy";

// The hand of the explainer videos: headings, labels, notes and the chat.
const hand = Patrick_Hand({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  fallback: ["Chalkboard SE", "Comic Sans MS", "cursive"],
});

// Long reading (a post's body, a README) stays in a plain sans.
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
  description: SITE.description,
};

// Runs before the first paint: a theme the reader picked earlier wins over the
// system's, and data-mode always says which one is showing (the toggle's icon reads it).
const THEME_SCRIPT = `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.setAttribute("data-theme",t);d.setAttribute("data-mode",t==="light"||t==="dark"?t:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"))}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${hand.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {/* Toast first: the ask drawer's "Copy email" chip raises one. */}
        <ToastProvider>
          <AskProvider>{children}</AskProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
