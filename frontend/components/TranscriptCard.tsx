"use client";

import React, { useState } from "react";
import { Mic, Copy, Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface TranscriptCardProps {
  transcript: string;
  language: string;
}

export const TranscriptCard: React.FC<TranscriptCardProps> = ({
  transcript,
  language,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!transcript || transcript === "(audio unrecognizable)") return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl p-5 glass-panel-subtle transition-all duration-300">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Mic className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t("transcript.title")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider glass-pill text-brand-300">
            {language.toUpperCase()}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded-lg glass-button text-slate-400 hover:text-white"
            title={t("transcript.copy")}
            aria-label={t("transcript.copy")}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <p className="text-base sm:text-lg font-medium text-slate-100 italic leading-relaxed">
        "{transcript}"
      </p>
    </div>
  );
};
