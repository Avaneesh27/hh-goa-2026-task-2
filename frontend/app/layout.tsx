import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Outfit',sans-serif] bg-[#030712] text-slate-100 min-h-screen flex flex-col justify-between selection:bg-brand-500 selection:text-white">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
