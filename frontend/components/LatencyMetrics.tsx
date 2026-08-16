import React from "react";
import { Gauge, Clock, Zap } from "lucide-react";
import { LatencyBreakdown, RetrievalStats } from "@/types/rag";

interface LatencyMetricsProps {
  latency: LatencyBreakdown;
  retrieval: RetrievalStats;
}

export const LatencyMetrics: React.FC<LatencyMetricsProps> = ({
  latency,
  retrieval,
}) => {
  const stages = [
    { label: "Sarvam STT", value: latency.stt_ms, color: "bg-purple-500" },
    { label: "Query Processing", value: latency.query_processing_ms, color: "bg-blue-500" },
    { label: "Query Embedding", value: latency.embedding_ms, color: "bg-cyan-500" },
    { label: "Dense Search (Qdrant)", value: latency.dense_retrieval_ms, color: "bg-indigo-500" },
    { label: "BM25 Search", value: latency.bm25_ms, color: "bg-teal-500" },
    { label: "Fusion (RRF)", value: latency.fusion_ms, color: "bg-emerald-500" },
    { label: "Reranker (Cross-Enc)", value: latency.reranking_ms, color: "bg-amber-500" },
    { label: "Context Selection", value: latency.context_selection_ms, color: "bg-orange-500" },
    { label: "Generation", value: latency.generation_ms, color: "bg-rose-500" },
    { label: "Guardrails", value: latency.guardrails_ms, color: "bg-pink-500" },
  ];

  const totalMs = latency.end_to_end_ms || latency.total_rag_ms || 1;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Latency & Retrieval Instrumentation
          </h3>
        </div>
        <span className="flex items-center gap-1 text-xs font-mono font-bold text-brand-400">
          <Zap className="w-3.5 h-3.5" />
          {latency.end_to_end_ms} ms total
        </span>
      </div>

      {/* Retrieval Counts Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-400">Dense Top-K</span>
          <span className="text-base font-mono font-bold text-indigo-400">{retrieval.dense_count}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-400">BM25 Top-K</span>
          <span className="text-base font-mono font-bold text-teal-400">{retrieval.bm25_count}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-400">Fused (RRF)</span>
          <span className="text-base font-mono font-bold text-emerald-400">{retrieval.fused_count}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-400">Reranked</span>
          <span className="text-base font-mono font-bold text-amber-400">{retrieval.reranked_count}</span>
        </div>
      </div>

      {/* Stage Breakdown Bars */}
      <div className="space-y-2">
        {stages.map((stg) => {
          const pct = Math.max(2, Math.min(100, (stg.value / totalMs) * 100));
          return (
            <div key={stg.label} className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">{stg.label}</span>
                <span className="font-semibold text-slate-200">{stg.value} ms</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
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
