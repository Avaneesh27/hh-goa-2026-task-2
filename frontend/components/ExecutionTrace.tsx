"use client";

import React, { useState } from "react";
import { Terminal, CheckCircle2, AlertTriangle, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ExecutionTraceProps {
  trace: string[];
  totalLatencyMs?: number;
  abstained?: boolean;
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({
  trace,
  totalLatencyMs,
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!trace || trace.length === 0) return null;

  return (
    <div className="rounded-xl p-6 sm:p-7 bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm transition-colors">
      <div className="flex items-center justify-between border-b border-[#EBE5D8] dark:border-[#232E42] pb-3 mb-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 flex items-center justify-center text-[#E85D42] dark:text-[#F8876B]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC] group-hover:text-[#E85D42] dark:group-hover:text-[#F06A50] transition-colors">
              {t("trace.title")}
            </h3>
            <span className="text-[11px] text-[#5A6478] dark:text-[#94A3B8] font-medium">
              {trace.length} {t("trace.steps")}
            </span>
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-[#5A6478] dark:text-[#94A3B8] ml-1" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[#5A6478] dark:text-[#94A3B8] ml-1" />
          )}
        </button>

        {totalLatencyMs !== undefined && (
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#FAF8F3] dark:bg-[#0B0F19] text-[#5A6478] dark:text-[#94A3B8] border border-[#EBE5D8] dark:border-[#232E42]">
            {totalLatencyMs} ms
          </span>
        )}
      </div>

      {!isCollapsed && (
        <div className="space-y-1.5 pt-1">
          {trace.map((step, idx) => {
            const isWarning = step.startsWith("⚠") || step.includes("abstained");
            const isRetry = step.startsWith("↻");

            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 text-xs rounded-lg transition-colors ${
                  isWarning
                    ? "text-[#92400E] dark:text-[#FDE68A] bg-[#FEF3C7]/40 dark:bg-[#FEF3C7]/10 border border-[#FDE68A] dark:border-[#FDE68A]/20 p-2"
                    : isRetry
                    ? "text-[#0369A1] dark:text-[#7DD3FC] bg-[#E0F2FE]/40 dark:bg-[#0284C7]/10 border border-[#BAE6FD] dark:border-[#0284C7]/20 p-2"
                    : "text-[#2D3748] dark:text-[#E2E8F0] bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] p-2"
                }`}
              >
                {isWarning ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                ) : isRetry ? (
                  <Cpu className="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed font-mono text-[11px] font-medium">{step}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
