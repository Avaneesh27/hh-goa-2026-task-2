"use client";

import React, { useState } from "react";
import { Copy, Check, ShieldCheck, AlertCircle, BookOpen } from "lucide-react";
import { RAGResponse } from "@/types/rag";
import { useTranslation } from "@/lib/i18n";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { TTSStatus } from "@/hooks/useTTS";

interface AnswerCardProps {
  response: RAGResponse;
  ttsStatus: TTSStatus;
  onPlayTTS: () => void;
  onPauseTTS: () => void;
  onResumeTTS: () => void;
  onReplayTTS: () => void;
  onStopTTS: () => void;
  isSupported: boolean;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  response,
  ttsStatus,
  onPlayTTS,
  onPauseTTS,
  onResumeTTS,
  onReplayTTS,
  onStopTTS,
  isSupported,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAbstained = response.abstained;

  return (
    <div
      className={`rounded-xl p-6 sm:p-7 bg-[#FFFFFF] dark:bg-[#161F30] border shadow-sm transition-colors ${
        isAbstained
          ? "border-[#FDE68A] dark:border-[#FDE68A]/30 bg-[#FFFDF7] dark:bg-[#1E1B4B]/20"
          : "border-[#EBE5D8] dark:border-[#232E42]"
      }`}
    >
      {/* Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EBE5D8] dark:border-[#232E42] pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
              isAbstained
                ? "bg-[#FEF3C7] dark:bg-[#FEF3C7]/10 text-[#D97706] border border-[#FDE68A] dark:border-[#FDE68A]/20"
                : "bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 text-[#E85D42] dark:text-[#F8876B] border border-[#FFD7CD] dark:border-[#FFD7CD]/20"
            }`}
          >
            {isAbstained ? "!" : "A"}
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC]">
              {isAbstained ? t("answer.decision") : t("answer.title")}
            </h3>
            <span className="text-[11px] text-[#5A6478] dark:text-[#94A3B8] font-medium">
              {response.language.toUpperCase()} • {t("answer.confidence")}: {Math.round(response.confidence * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Grounded vs Abstained Status Badge */}
          {isAbstained ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FEF3C7] dark:bg-[#FEF3C7]/10 text-[#92400E] dark:text-[#FDE68A] border border-[#FDE68A] dark:border-[#FDE68A]/30">
              <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
              {t("answer.abstainedBadge")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#DCFCE7] dark:bg-[#14532D]/30 text-[#166534] dark:text-[#4ADE80] border border-[#BBF7D0] dark:border-[#14532D]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
              {t("answer.groundedBadge")}
            </span>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg paper-button text-[#5A6478] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]"
            title={t("answer.copy")}
            aria-label={t("answer.copy")}
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#16A34A]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Answer Core Body */}
      <div className="space-y-5">
        <div
          className={`p-5 sm:p-6 rounded-xl text-base sm:text-lg leading-relaxed font-normal ${
            isAbstained
              ? "bg-[#FEF3C7]/30 dark:bg-[#78350F]/20 border border-[#FDE68A] dark:border-[#FDE68A]/30 text-[#78350F] dark:text-[#FDE68A]"
              : "bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] text-[#172033] dark:text-[#F8FAFC]"
          }`}
        >
          {response.answer}
        </div>

        {/* Abstention Reason Note if applicable */}
        {isAbstained && (response.abstention_reason || response.answer.includes("ABSTAIN")) && (
          <p className="text-xs text-[#92400E] dark:text-[#FDE68A] italic px-1 font-medium">
            {t("answer.abstentionReason")}: {response.abstention_reason || t("answer.abstentionDefault")}
          </p>
        )}

        {/* Integrated Audio Voice Narration Bar */}
        <AudioPlayerBar
          status={ttsStatus}
          onPlay={onPlayTTS}
          onPause={onPauseTTS}
          onResume={onResumeTTS}
          onReplay={onReplayTTS}
          onStop={onStopTTS}
          isSupported={isSupported}
        />

        {/* Meta summary footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-[#5A6478] dark:text-[#94A3B8] border-t border-[#EBE5D8] dark:border-[#232E42]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#5A6478] dark:text-[#94A3B8]">
              <BookOpen className="w-4 h-4 text-[#E85D42] dark:text-[#F06A50]" />
              {t("answer.retrieval")}:{" "}
              <strong className="text-[#172033] dark:text-[#F8FAFC] font-semibold">
                {response.retrieval.selected_count || response.retrieval.reranked_count} {t("evidence.sources")}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#5A6478] dark:text-[#94A3B8]">{t("answer.totalLatency")}:</span>
            <span className="font-mono font-bold text-[#E85D42] dark:text-[#F06A50] px-2 py-0.5 rounded-md bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42]">
              {response.latency.end_to_end_ms} ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
