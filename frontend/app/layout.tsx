import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { ThemeTransition } from "@/components/ThemeTransition";

export const metadata: Metadata = {
  title: "HH Goa 2026 — Voice-Enabled Multilingual Indic RAG",
  description:
    "Low-latency deterministic Voice-Enabled RAG model for Hindi, English, and 14 Indian languages with Sarvam STT, Qdrant, BM25, and MSMARCO-XI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-[#FAF8F3] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F8FAFC] min-h-screen flex flex-col justify-between selection:bg-[#FFD7CD] selection:text-[#752516] antialiased transition-colors duration-300">
        <ThemeProvider>
          <I18nProvider>
            <ThemeTransition />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
