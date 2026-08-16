import React from "react";
import { CheckCircle2, AlertTriangle, Activity, ShieldCheck, Cpu } from "lucide-react";

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
  if (!trace || trace.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Pipeline Execution Trace
          </h3>
        </div>
        {totalLatencyMs !== undefined && (
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
            {totalLatencyMs} ms
          </span>
        )}
      </div>

      <div className="space-y-2">
        {trace.map((step, idx) => {
          const isWarning = step.startsWith("⚠") || step.includes("abstained");
          const isRetry = step.startsWith("↻");

          return (
            <div
              key={idx}
              className={`flex items-start gap-2 text-xs transition-all duration-300 ${
                isWarning
                  ? "text-amber-300 bg-amber-950/20 border border-amber-800/30 p-2 rounded-lg"
                  : isRetry
                  ? "text-sky-300 bg-sky-950/20 border border-sky-800/30 p-2 rounded-lg"
                  : "text-slate-300"
              }`}
            >
              {isWarning ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              ) : isRetry ? (
                <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-mono">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
