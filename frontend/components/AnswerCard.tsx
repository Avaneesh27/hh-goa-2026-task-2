import React, { useState } from "react";
import { Copy, Check, ShieldCheck, AlertOctagon, Sparkles, Volume2 } from "lucide-react";
import { RAGResponse } from "@/types/rag";

interface AnswerCardProps {
  response: RAGResponse;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ response }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAbstained = response.abstained;

  return (
    <div
      className={`rounded-3xl p-6 border backdrop-blur-xl shadow-2xl transition-all duration-500 ${
        isAbstained
          ? "bg-slate-900/80 border-amber-500/40 shadow-amber-500/10"
          : "bg-slate-900/80 border-brand-500/30 shadow-brand-500/10"
      }`}
    >
      {/* Transcript Header */}
      <div className="border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Transcribed Query
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-brand-300">
            {response.language.toUpperCase()}
          </span>
        </div>
        <p className="text-base sm:text-lg font-semibold text-slate-100 leading-snug">
          "{response.transcript}"
        </p>
      </div>

      {/* Answer Body */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isAbstained ? "System Decision" : "Grounded Answer"}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Grounded / Abstained Pill */}
            {isAbstained ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertOctagon className="w-3.5 h-3.5" />
                Abstained (No Hallucination)
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Grounded in MSMARCO-XI
              </span>
            )}

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Copy Answer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Answer Text */}
        <div
          className={`p-5 rounded-2xl border text-sm sm:text-base leading-relaxed ${
            isAbstained
              ? "bg-amber-950/20 border-amber-800/40 text-amber-100"
              : "bg-slate-800/40 border-slate-700/60 text-slate-100 font-normal"
          }`}
        >
          {response.answer}
        </div>

        {/* Abstention Reason Note if applicable */}
        {isAbstained && response.abstention_reason && (
          <p className="text-xs text-amber-400/80 italic">
            Reason: {response.abstention_reason}
          </p>
        )}

        {/* Confidence & Latency Summary Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/60">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">Confidence: </span>
              <span className="font-semibold text-slate-200">
                {Math.round(response.confidence * 100)}%
              </span>
            </div>
            <div>
              <span className="text-slate-500">Retrieval: </span>
              <span className="font-semibold text-slate-200">
                Dense {response.retrieval.dense_count} | BM25 {response.retrieval.bm25_count} | Fused {response.retrieval.fused_count}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-500">Total Latency: </span>
            <span className="font-mono font-bold text-brand-400">
              {response.latency.end_to_end_ms} ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
