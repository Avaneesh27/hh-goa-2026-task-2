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

  const staggerClasses = ["stagger-1", "stagger-2", "stagger-3", "stagger-4"];

  return (
    <div className="rounded-3xl p-6 sm:p-7 bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-warm-md transition-all duration-300">
      <div className="flex items-center justify-between border-b border-[#EBE5D8] dark:border-[#232E42] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 flex items-center justify-center text-[#E85D42] dark:text-[#F8876B]">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC]">
            {t("evidence.title")} ({evidence.length} {t("evidence.sources")})
          </h3>
        </div>
        <span className="text-[11px] text-[#5A6478] dark:text-[#94A3B8] font-medium">
          {t("evidence.dataset")}
        </span>
      </div>

      <div className="space-y-3">
        {evidence.map((item, idx) => {
          const isExpanded = expandedIndex === idx;
          const previewText = item.text.length > 220 ? item.text.slice(0, 220) + "..." : item.text;
          const sourceNumber = (idx + 1).toString().padStart(2, "0");
          const staggerClass = staggerClasses[idx % staggerClasses.length];

          return (
            <div
              key={item.chunk_id || idx}
              className={`p-4 sm:p-5 rounded-2xl bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] hover:border-[#DDD5C4] dark:hover:border-[#334155] transition-all duration-300 animate-fadeIn ${staggerClass}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#FFFFFF] dark:bg-[#161F30] text-[#E85D42] dark:text-[#F8876B] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm">
                    SOURCE {sourceNumber}
                  </span>
                  <span className="text-xs font-mono text-[#5A6478] dark:text-[#94A3B8]">
                    {item.document_id}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-[#FFFFFF] text-[#5A6478] border border-[#EBE5D8] font-medium text-[11px]">
                    {t("evidence.lang")}: {item.language.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 text-[#16A34A] font-mono font-bold text-xs bg-[#DCFCE7] px-2 py-0.5 rounded-md border border-[#BBF7D0]">
                    <Award className="w-3.5 h-3.5" />
                    {(item.score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#2D3748] leading-relaxed font-normal">
                {isExpanded ? item.text : previewText}
              </p>

              {item.text.length > 220 && (
                <button
                  onClick={() => toggleExpand(idx)}
                  className="mt-2.5 text-xs text-[#E85D42] hover:text-[#D14328] font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
