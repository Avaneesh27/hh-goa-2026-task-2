"use client";

import React, { useEffect } from "react";
import { X, Mic, Search, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps = [
    {
      icon: <Mic className="w-5 h-5 text-purple-400" />,
      title: t("howItWorks.step1.title"),
      desc: t("howItWorks.step1.desc"),
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: <Search className="w-5 h-5 text-indigo-400" />,
      title: t("howItWorks.step2.title"),
      desc: t("howItWorks.step2.desc"),
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: <Layers className="w-5 h-5 text-teal-400" />,
      title: t("howItWorks.step3.title"),
      desc: t("howItWorks.step3.desc"),
      bg: "bg-teal-500/10 border-teal-500/20",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      title: t("howItWorks.step4.title"),
      desc: t("howItWorks.step4.desc"),
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated p-6 sm:p-7 shadow-2xl z-10 border border-white/15 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {t("howItWorks.title")}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t("howItWorks.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl glass-button text-slate-400 hover:text-white"
            aria-label={t("howItWorks.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-3.5">
          {steps.map((stg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${stg.bg} flex items-start gap-3.5 transition-all`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900/80 flex items-center justify-center shrink-0 shadow-sm border border-white/10">
                {stg.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-100 tracking-wide">
                  {stg.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-normal">
                  {stg.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
          >
            {t("howItWorks.close")}
          </button>
        </div>
      </div>
    </div>
  );
};
