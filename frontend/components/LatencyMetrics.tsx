"use client";

import React from "react";
import { Gauge, Zap, Layers, Cpu } from "lucide-react";
import { LatencyBreakdown, RetrievalStats } from "@/types/rag";
import { useTranslation } from "@/lib/i18n";

interface LatencyMetricsProps {
  latency: LatencyBreakdown;
  retrieval: RetrievalStats;
}

export const LatencyMetrics: React.FC<LatencyMetricsProps> = ({
  latency,
  retrieval,
}) => {
  const { t } = useTranslation();

  const stages = [
    { label: t("latency.stage.stt"), value: latency.stt_ms, color: "bg-purple-500" },
    { label: t("latency.stage.query"), value: latency.query_processing_ms, color: "bg-blue-500" },
    { label: t("latency.stage.embedding"), value: latency.embedding_ms, color: "bg-cyan-500" },
    { label: t("latency.stage.dense"), value: latency.dense_retrieval_ms, color: "bg-indigo-500" },
    { label: t("latency.stage.bm25"), value: latency.bm25_ms, color: "bg-teal-500" },
    { label: t("latency.stage.fusion"), value: latency.fusion_ms, color: "bg-emerald-500" },
    { label: t("latency.stage.rerank"), value: latency.reranking_ms, color: "bg-amber-500" },
    { label: t("latency.stage.context"), value: latency.context_selection_ms, color: "bg-orange-500" },
    { label: t("latency.stage.generation"), value: latency.generation_ms, color: "bg-rose-500" },
    { label: t("latency.stage.guardrails"), value: latency.guardrails_ms, color: "bg-pink-500" },
  ];

  const totalMs = latency.end_to_end_ms || latency.total_rag_ms || 1;

  return (
    <div className="rounded-3xl p-6 glass-panel border-white/10 shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400">
            <Gauge className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {t("latency.title")}
          </h3>
        </div>
        <span className="flex items-center gap-1 text-xs font-mono font-bold text-brand-300 px-2.5 py-1 rounded-full glass-pill">
          <Zap className="w-3.5 h-3.5" />
          {latency.end_to_end_ms} ms {t("latency.total")}
        </span>
      </div>

      {/* Retrieval Counts Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <div className="p-3 rounded-2xl glass-panel-subtle text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
            {t("latency.dense")}
          </span>
          <span className="text-base font-mono font-bold text-indigo-400">
            {retrieval.dense_count}
          </span>
        </div>
        <div className="p-3 rounded-2xl glass-panel-subtle text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
            {t("latency.bm25")}
          </span>
          <span className="text-base font-mono font-bold text-teal-400">
            {retrieval.bm25_count}
          </span>
        </div>
        <div className="p-3 rounded-2xl glass-panel-subtle text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
            {t("latency.fused")}
          </span>
          <span className="text-base font-mono font-bold text-emerald-400">
            {retrieval.fused_count}
          </span>
        </div>
        <div className="p-3 rounded-2xl glass-panel-subtle text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
            {t("latency.reranked")}
          </span>
          <span className="text-base font-mono font-bold text-amber-400">
            {retrieval.reranked_count}
          </span>
        </div>
      </div>

      {/* Stage Breakdown Bars */}
      <div className="space-y-2.5">
        {stages.map((stg) => {
          const pct = Math.max(2, Math.min(100, (stg.value / totalMs) * 100));
          return (
            <div key={stg.label} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400 font-sans text-[11px]">{stg.label}</span>
                <span className="font-semibold text-slate-200">{stg.value} ms</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950/80 overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full ${stg.color} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
