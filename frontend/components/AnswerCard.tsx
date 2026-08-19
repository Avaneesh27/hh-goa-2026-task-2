"use client";

import React, { useState } from "react";
import { Copy, Check, ShieldCheck, AlertCircle, Sparkles, BookOpen, Zap } from "lucide-react";
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
      className={`rounded-3xl p-6 sm:p-8 bg-[#FFFFFF] dark:bg-[#161F30] border shadow-warm-md transition-all duration-300 ${
        isAbstained
          ? "border-[#FDE68A] dark:border-[#FDE68A]/30 bg-[#FFFDF7] dark:bg-[#1E1B4B]/30"
          : "border-[#EBE5D8] dark:border-[#232E42]"
      }`}
    >
      {/* Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EBE5D8] dark:border-[#232E42] pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
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
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
              {t("answer.abstainedBadge")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              {t("answer.groundedBadge")}
            </span>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl paper-button text-[#5A6478] hover:text-[#172033]"
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
          className={`p-5 sm:p-6 rounded-2xl text-base sm:text-lg leading-relaxed font-normal ${
            isAbstained
              ? "bg-[#FEF3C7]/40 border border-[#FDE68A] text-[#78350F]"
              : "bg-[#FAF8F3] border border-[#EBE5D8] text-[#172033]"
          }`}
        >
          {response.answer}
        </div>

        {/* Abstention Reason Note if applicable */}
        {isAbstained && (response.abstention_reason || response.answer.includes("ABSTAIN")) && (
          <p className="text-xs text-[#92400E] italic px-1 font-medium">
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-[#5A6478] border-t border-[#EBE5D8]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#5A6478]">
              <BookOpen className="w-4 h-4 text-[#E85D42]" />
              {t("answer.retrieval")}:{" "}
              <strong className="text-[#172033] font-semibold">
                {response.retrieval.selected_count || response.retrieval.reranked_count} {t("evidence.sources")}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#5A6478]">{t("answer.totalLatency")}:</span>
            <span className="font-mono font-bold text-[#E85D42] px-2.5 py-0.5 rounded-lg bg-[#FFEDE8] border border-[#FFD7CD]">
              ⚡ {response.latency.end_to_end_ms} ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
