"use client";

import React, { useState, useEffect } from "react";
import {
  Github,
  Settings,
  ArrowUp,
  Layers,
  Globe,
  ExternalLink,
  Cpu,
  Mic,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface FooterProps {
  onOpenSettings?: () => void;
  onOpenHowItWorks?: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: "hi", name: "Hindi", script: "हिंदी" },
  { code: "mr", name: "Marathi", script: "मराठी" },
  { code: "bn", name: "Bengali", script: "বাংলা" },
  { code: "ta", name: "Tamil", script: "தமிழ்" },
  { code: "te", name: "Telugu", script: "తెలుగు" },
  { code: "gu", name: "Gujarati", script: "ગુજરાતી" },
  { code: "kn", name: "Kannada", script: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", script: "മലയാളം" },
  { code: "pa", name: "Punjabi", script: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", script: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", script: "অসমীয়া" },
  { code: "ur", name: "Urdu", script: "اردو" },
  { code: "sa", name: "Sanskrit", script: "संस्कृतम्" },
  { code: "ne", name: "Nepali", script: "नेपाली" },
  { code: "en", name: "English", script: "English" },
];

export const Footer: React.FC<FooterProps> = ({
  onOpenSettings,
  onOpenHowItWorks,
}) => {
  const { t } = useTranslation();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="w-full border-t border-[#EBE5D8] dark:border-[#232E42] bg-[#FAF8F3] dark:bg-[#0B0F19] transition-colors duration-300 relative z-20">
      {/* Upper Footer: Status Bar & Back to Top */}
      <div className="border-b border-[#EBE5D8] dark:border-[#232E42] bg-[#FFFFFF]/60 dark:bg-[#161F30]/40 backdrop-blur-md">
        <div className="w-[94%] sm:w-[90%] md:w-[85%] lg:w-[80%] max-w-[1440px] mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Live System Beacon */}
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#172033] dark:text-[#F8FAFC]">
              All Systems Operational
            </span>
            <span className="hidden md:inline-block text-xs font-mono text-[#8B95A5] dark:text-[#64748B]">
              • MSMARCO-XI Live Knowledge Base
            </span>
          </div>

          {/* Back to Top Button */}
          <button
            onClick={scrollToTop}
            id="footer-back-to-top-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg paper-button text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]"
            title="Scroll back to top of page"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#E85D42] dark:text-[#F06A50]" />
          </button>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="w-[94%] sm:w-[90%] md:w-[85%] lg:w-[80%] max-w-[1440px] mx-auto px-4 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Brand & Overview (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#E85D42] dark:bg-[#F06A50] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#172033] dark:text-[#F8FAFC] tracking-tight">
                  Voice RAG Studio
                </h3>
                <p className="text-[11px] font-mono text-[#8B95A5] dark:text-[#64748B]">
                  Multilingual Indic Retrieval-Augmented Generation
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#5A6478] dark:text-[#94A3B8] leading-relaxed max-w-md">
              A high-precision, sub-200ms voice RAG system fusing Qdrant dense vector search, BM25 inverted lexical indexing, BGE cross-encoder reranking, and 4-tier deterministic guardrails for zero hallucination.
            </p>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="https://github.com/Avaneesh27/hh-goa-2026-task-2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg paper-button text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 text-[#8B95A5]" />
              </a>

              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg paper-button text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
              )}

              {onOpenHowItWorks && (
                <button
                  onClick={onOpenHowItWorks}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg paper-button text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]"
                >
                  <Layers className="w-3.5 h-3.5 text-[#E85D42] dark:text-[#F06A50]" />
                  <span>Architecture</span>
                </button>
              )}

              <a
                href="http://localhost:8000/health"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg paper-button text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>API Health</span>
              </a>
            </div>
          </div>

          {/* Column 2: Engine Stack (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#E85D42] dark:text-[#F06A50]" />
              <span>Pipeline Engine</span>
            </h4>
            <ul className="space-y-2 text-xs text-[#5A6478] dark:text-[#94A3B8]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Qdrant 384-d Cosine Vector ANN</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Rank-BM25 Lexical Inverted Index</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>BAAI/bge-reranker-base Cross-Attention</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Sarvam AI saarika:v2 & bulbul:v3</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>4-Tier Deterministic NLI Guardrails</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Indic Language Support (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#3B82F6]" />
              <span>15 Indic Languages Supported</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <span
                  key={lang.code}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-[#2D3748] dark:text-[#CBD5E1]"
                >
                  <strong className="font-semibold text-[#172033] dark:text-[#F8FAFC] mr-1">
                    {lang.script}
                  </strong>
                  ({lang.name})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="mt-10 pt-5 border-t border-[#EBE5D8] dark:border-[#232E42] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8B95A5] dark:text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#172033] dark:text-[#F8FAFC]">
              Hackathon Goa 2026
            </span>
            <span>• Task 2 Multilingual Voice-Enabled RAG</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Sub-200ms Target</span>
            <span>•</span>
            <span>Zero Hallucination Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
