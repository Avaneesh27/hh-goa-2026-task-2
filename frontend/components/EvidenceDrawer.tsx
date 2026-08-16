import React from "react";
import { BookOpen, Tag, Award } from "lucide-react";
import { EvidenceChunk } from "@/types/rag";

interface EvidenceDrawerProps {
  evidence: EvidenceChunk[];
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ evidence }) => {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Retrieved Evidence ({evidence.length} Sources)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Source: AI4Bharat MSMARCO-XI
        </span>
      </div>

      <div className="space-y-3">
        {evidence.map((item, idx) => (
          <div
            key={item.chunk_id || idx}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-brand-500/40 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {item.citation_id || `[${idx + 1}]`}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {item.document_id}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                  Lang: {item.language.toUpperCase()}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono font-semibold">
                  <Award className="w-3 h-3" />
                  {(item.score * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
