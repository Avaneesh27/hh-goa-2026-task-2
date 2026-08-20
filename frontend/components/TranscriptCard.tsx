"use client";

import React, { useState } from "react";
import { Copy, Check, MessageSquare } from "lucide-react";
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
    <div className="rounded-xl p-5 sm:p-6 bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm transition-colors relative">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 flex items-center justify-center text-[#E85D42] dark:text-[#F8876B]">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#5A6478] dark:text-[#94A3B8]">
            {t("transcript.title")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FAF8F3] dark:bg-[#0B0F19] text-[#5A6478] dark:text-[#94A3B8] border border-[#EBE5D8] dark:border-[#232E42]">
            {language.toUpperCase()}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg paper-button text-[#5A6478] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]"
            title={t("transcript.copy")}
            aria-label={t("transcript.copy")}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#16A34A]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <p className="text-base sm:text-lg font-medium text-[#172033] dark:text-[#F8FAFC] leading-relaxed pl-3 border-l-2 border-[#E85D42]/40">
        "{transcript}"
      </p>
    </div>
  );
};
