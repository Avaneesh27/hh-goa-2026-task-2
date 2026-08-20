"use client";

import React from "react";
import { Activity } from "lucide-react";
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
    { label: t("latency.stage.stt"), value: latency.stt_ms, color: "bg-[#F97316]" },
    { label: t("latency.stage.query"), value: latency.query_processing_ms, color: "bg-[#3B82F6]" },
    { label: t("latency.stage.embedding"), value: latency.embedding_ms, color: "bg-[#06B6D4]" },
    { label: t("latency.stage.dense"), value: latency.dense_retrieval_ms, color: "bg-[#6366F1]" },
    { label: t("latency.stage.bm25"), value: latency.bm25_ms, color: "bg-[#0D9488]" },
    { label: t("latency.stage.fusion"), value: latency.fusion_ms, color: "bg-[#16A34A]" },
    { label: t("latency.stage.rerank"), value: latency.reranking_ms, color: "bg-[#D97706]" },
    { label: t("latency.stage.context"), value: latency.context_selection_ms, color: "bg-[#EA580C]" },
    { label: t("latency.stage.generation"), value: latency.generation_ms, color: "bg-[#E85D42]" },
    { label: t("latency.stage.guardrails"), value: latency.guardrails_ms, color: "bg-[#10B981]" },
  ];

  const totalMs = latency.end_to_end_ms || latency.total_rag_ms || 1;

  return (
    <div className="rounded-xl p-6 sm:p-7 bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EBE5D8] dark:border-[#232E42] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 flex items-center justify-center text-[#E85D42] dark:text-[#F8876B]">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC]">
            {t("latency.title")}
          </h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#E85D42] dark:text-[#F06A50] px-2.5 py-0.5 rounded-md bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42]">
          {latency.end_to_end_ms} ms {t("latency.total")}
        </span>
      </div>

      {/* Retrieval Counts Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] text-center">
          <span className="block text-[10px] uppercase font-bold text-[#5A6478] dark:text-[#94A3B8] mb-0.5">
            {t("latency.dense")}
          </span>
          <span className="text-base font-mono font-bold text-[#6366F1]">
            {retrieval.dense_count}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] text-center">
          <span className="block text-[10px] uppercase font-bold text-[#5A6478] dark:text-[#94A3B8] mb-0.5">
            {t("latency.bm25")}
          </span>
          <span className="text-base font-mono font-bold text-[#0D9488]">
            {retrieval.bm25_count}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] text-center">
          <span className="block text-[10px] uppercase font-bold text-[#5A6478] dark:text-[#94A3B8] mb-0.5">
            {t("latency.fused")}
          </span>
          <span className="text-base font-mono font-bold text-[#16A34A]">
            {retrieval.fused_count}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] text-center">
          <span className="block text-[10px] uppercase font-bold text-[#5A6478] dark:text-[#94A3B8] mb-0.5">
            {t("latency.reranked")}
          </span>
          <span className="text-base font-mono font-bold text-[#D97706]">
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
                <span className="text-[#5A6478] dark:text-[#94A3B8] font-sans text-[11px] font-medium">{stg.label}</span>
                <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">{stg.value} ms</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#FAF8F3] dark:bg-[#0B0F19] overflow-hidden border border-[#EBE5D8] dark:border-[#232E42]">
                <div
                  className={`h-full rounded-full ${stg.color} transition-all duration-300`}
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
