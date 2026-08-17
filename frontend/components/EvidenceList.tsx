"use client";

import React, { useState } from "react";
import { BookOpen, Award, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { EvidenceChunk } from "@/types/rag";
import { useTranslation } from "@/lib/i18n";

interface EvidenceListProps {
  evidence: EvidenceChunk[];
}

export const EvidenceList: React.FC<EvidenceListProps> = ({ evidence }) => {
  const { t } = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!evidence || evidence.length === 0) return null;

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="rounded-3xl p-6 glass-panel border-white/10 shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {t("evidence.title")} ({evidence.length} {t("evidence.sources")})
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {t("evidence.dataset")}
        </span>
      </div>

      <div className="space-y-3">
        {evidence.map((item, idx) => {
          const isExpanded = expandedIndex === idx;
          const previewText = item.text.length > 220 ? item.text.slice(0, 220) + "..." : item.text;

          return (
            <div
              key={item.chunk_id || idx}
              className="p-4 rounded-2xl glass-panel-subtle hover:border-brand-500/30 transition-all duration-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {item.citation_id || `[${idx + 1}]`}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Doc: {item.document_id}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-md glass-pill text-slate-300 font-medium text-[11px]">
                    {t("evidence.lang")}: {item.language.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-mono font-semibold text-xs">
                    <Award className="w-3.5 h-3.5" />
                    {(item.score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {isExpanded ? item.text : previewText}
              </p>

              {item.text.length > 220 && (
                <button
                  onClick={() => toggleExpand(idx)}
                  className="mt-2 text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <span>{t("evidence.collapse")}</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>{t("evidence.expand")}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
