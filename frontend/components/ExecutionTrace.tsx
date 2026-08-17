"use client";

import React, { useState } from "react";
import { Activity, CheckCircle2, AlertTriangle, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ExecutionTraceProps {
  trace: string[];
  totalLatencyMs?: number;
  abstained?: boolean;
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({
  trace,
  totalLatencyMs,
  abstained,
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!trace || trace.length === 0) return null;

  return (
    <div className="rounded-3xl p-6 glass-panel border-white/10 shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-7 h-7 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t("trace.title")}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {trace.length} {t("trace.steps")}
            </span>
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400 ml-1" />
          )}
        </button>

        {totalLatencyMs !== undefined && (
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full glass-pill text-brand-300">
            {totalLatencyMs} ms
          </span>
        )}
      </div>

      {!isCollapsed && (
        <div className="space-y-2 pt-1">
          {trace.map((step, idx) => {
            const isWarning = step.startsWith("⚠") || step.includes("abstained");
            const isRetry = step.startsWith("↻");

            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 text-xs transition-all duration-200 ${
                  isWarning
                    ? "text-amber-300 bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl"
                    : isRetry
                    ? "text-sky-300 bg-sky-950/30 border border-sky-500/30 p-2.5 rounded-xl"
                    : "text-slate-300 p-1.5"
                }`}
              >
                {isWarning ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                ) : isRetry ? (
                  <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed font-mono text-[11px]">{step}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
