"use client";

import React, { useEffect } from "react";
import { X, Mic, Search, Layers, ShieldCheck } from "lucide-react";
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
      step: "01",
      icon: <Mic className="w-4 h-4 text-[#E85D42]" />,
      title: t("howItWorks.step1.title"),
      desc: t("howItWorks.step1.desc"),
    },
    {
      step: "02",
      icon: <Search className="w-4 h-4 text-[#3B82F6]" />,
      title: t("howItWorks.step2.title"),
      desc: t("howItWorks.step2.desc"),
    },
    {
      step: "03",
      icon: <Layers className="w-4 h-4 text-[#0D9488]" />,
      title: t("howItWorks.step3.title"),
      desc: t("howItWorks.step3.desc"),
    },
    {
      step: "04",
      icon: <ShieldCheck className="w-4 h-4 text-[#16A34A]" />,
      title: t("howItWorks.step4.title"),
      desc: t("howItWorks.step4.desc"),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Dialog Card */}
      <div className="relative w-full max-w-lg rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] p-6 sm:p-7 shadow-xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#EBE5D8] dark:border-[#232E42]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 flex items-center justify-center text-[#E85D42] dark:text-[#F8876B]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033] dark:text-[#F8FAFC]">
                {t("howItWorks.title")}
              </h2>
              <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8]">
                {t("howItWorks.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg paper-button text-[#5A6478] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Pipeline Steps */}
        <div className="space-y-3">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] flex items-start gap-3.5 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                {s.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-[#E85D42] dark:text-[#F06A50]">
                    STEP {s.step}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-[#172033] dark:text-[#F8FAFC]">
                    {s.title}
                  </h3>
                </div>
                <p className="text-xs text-[#5A6478] dark:text-[#94A3B8] leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
