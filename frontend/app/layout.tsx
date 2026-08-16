import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HH Goa 2026 — Voice-Enabled Multilingual RAG",
  description: "Low-latency deterministic Voice-Enabled RAG model for Hindi and 14 Indian languages using Sarvam STT and MSMARCO-XI.",
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
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Outfit',sans-serif] bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
