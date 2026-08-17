"use client";

import React, { useState } from "react";
import { Copy, Check, ShieldCheck, AlertOctagon, Sparkles, Volume2, Award } from "lucide-react";
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
  isTTSSupported: boolean;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  response,
  ttsStatus,
  onPlayTTS,
  onPauseTTS,
  onResumeTTS,
  onReplayTTS,
  onStopTTS,
  isTTSSupported,
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
      className={`rounded-3xl p-6 sm:p-7 border backdrop-blur-2xl shadow-2xl transition-all duration-500 ${
        isAbstained
          ? "glass-panel border-amber-500/35 shadow-amber-500/10"
          : "glass-panel-elevated border-brand-500/35 shadow-brand-500/15"
      }`}
    >
      {/* Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              {isAbstained ? t("answer.decision") : t("answer.title")}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {response.language.toUpperCase()} • {t("answer.confidence")}: {Math.round(response.confidence * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Grounded vs Abstained Status Pill */}
          {isAbstained ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <AlertOctagon className="w-3.5 h-3.5" />
              {t("answer.abstainedBadge")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("answer.groundedBadge")}
            </span>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl glass-button text-slate-300 hover:text-white"
            title={t("answer.copy")}
            aria-label={t("answer.copy")}
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Answer Core Body */}
      <div className="space-y-4">
        <div
          className={`p-5 sm:p-6 rounded-2xl border text-sm sm:text-base leading-relaxed tracking-normal font-normal ${
            isAbstained
              ? "bg-amber-950/20 border-amber-500/25 text-amber-100"
              : "bg-slate-900/60 border-white/10 text-slate-100 shadow-inner"
          }`}
        >
          {response.answer}
        </div>

        {/* Abstention Reason Note if applicable */}
        {isAbstained && (response.abstention_reason || response.answer.includes("ABSTAIN")) && (
          <p className="text-xs text-amber-300/85 italic px-1">
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
          isSupported={isTTSSupported}
        />

        {/* Meta summary footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-400 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Award className="w-3.5 h-3.5 text-brand-400" />
              {t("answer.retrieval")}:{" "}
              <strong className="text-slate-200 font-mono">
                {response.retrieval.selected_count || response.retrieval.reranked_count} {t("evidence.sources")}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{t("answer.totalLatency")}:</span>
            <span className="font-mono font-bold text-brand-300 px-2 py-0.5 rounded-md glass-pill">
              {response.latency.end_to_end_ms} ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
