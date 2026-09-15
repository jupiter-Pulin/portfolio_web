import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AskProvider } from "@/components/AskDrawer";
import { ToastProvider } from "@/components/Toast";
import { SITE } from "@/content/copy";

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
  description: SITE.description,
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
        {/* Vercel Web Analytics: page views only, no cookies. Vercel serves the script
            itself, so this adds no dependency; outside Vercel the request simply 404s. */}
        <Script id="vercel-analytics-queue" strategy="afterInteractive">
          {"window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };"}
        </Script>
        <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
