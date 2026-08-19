"use client";

import React, { useEffect } from "react";
import { X, Volume2, EyeOff, Sliders, Globe, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoPlayEnabled: boolean;
  onToggleAutoPlay: (enabled: boolean) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: (enabled: boolean) => void;
  showTelemetry: boolean;
  onToggleTelemetry: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  autoPlayEnabled,
  onToggleAutoPlay,
  reducedMotion,
  onToggleReducedMotion,
  showTelemetry,
  onToggleTelemetry,
}) => {
  const {
    t,
    pageLanguage,
    setPageLanguage,
    syncVoiceWithPage,
    setSyncVoiceWithPage,
    languages,
  } = useTranslation();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] p-6 sm:p-8 shadow-warm-xl z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#EBE5D8] dark:border-[#232E42]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 flex items-center justify-center text-[#E85D42] dark:text-[#F8876B]">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#172033] dark:text-[#F8FAFC]">
              {t("settings.title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl paper-button text-[#5A6478] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]"
            aria-label={t("settings.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Section: Whole Website Language */}
          <div className="p-4 rounded-2xl bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] space-y-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-[#172033] dark:text-[#F8FAFC]">
                <Globe className="w-4 h-4 text-[#E85D42] dark:text-[#F8876B]" />
                <span>{t("pageLanguage") || "Page Language"}</span>
              </div>
              <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8]">
                {t("pageLanguageDesc") ||
                  "Controls the language of the entire website interface, navigation, settings, and documentation."}
              </p>
            </div>

            <div className="relative w-full">
              <select
                value={pageLanguage}
                onChange={(e) => setPageLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] shadow-sm focus:outline-none focus:border-[#E85D42] cursor-pointer"
                aria-label={t("pageLanguage") || "Page Language"}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#FFFFFF] dark:bg-[#161F30] text-[#172033] dark:text-[#F8FAFC]">
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Sync Toggle */}
            <div className="pt-2 border-t border-[#EBE5D8]/70 dark:border-[#232E42] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-[#172033] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-[#5A6478] dark:text-[#94A3B8]" />
                  {t("syncLanguage") || "Use page language for voice interaction"}
                </span>
                <p className="text-[10px] text-[#5A6478] dark:text-[#94A3B8]">
                  {t("syncLanguageDesc") || "Automatically sync voice language whenever page language changes"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSyncVoiceWithPage(!syncVoiceWithPage)}
                className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer shrink-0 ${
                  syncVoiceWithPage ? "bg-[#E85D42]" : "bg-[#DDD5C4]"
                }`}
                aria-label="Sync Voice with Page"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                    syncVoiceWithPage ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 1. Auto-play Voice Narration Toggle */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF8F3] border border-[#EBE5D8]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-[#172033]">
                <Volume2 className="w-4 h-4 text-[#E85D42]" />
                <span>{t("settings.autoplay")}</span>
              </div>
              <p className="text-[11px] text-[#5A6478]">
                {t("settings.autoplayDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleAutoPlay(!autoPlayEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer shrink-0 ${
                autoPlayEnabled ? "bg-[#E85D42]" : "bg-[#DDD5C4]"
              }`}
              aria-label={t("settings.autoplay")}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  autoPlayEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 2. Reduced Motion Toggle */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF8F3] border border-[#EBE5D8]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-[#172033]">
                <EyeOff className="w-4 h-4 text-[#E85D42]" />
                <span>{t("settings.reducedMotion")}</span>
              </div>
              <p className="text-[11px] text-[#5A6478]">
                {t("settings.reducedMotionDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleReducedMotion(!reducedMotion)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer shrink-0 ${
                reducedMotion ? "bg-[#E85D42]" : "bg-[#DDD5C4]"
              }`}
              aria-label={t("settings.reducedMotion")}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  reducedMotion ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 3. Show Technical Telemetry Toggle */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF8F3] border border-[#EBE5D8]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-[#172033]">
                <Sliders className="w-4 h-4 text-[#E85D42]" />
                <span>{t("settings.technicalDetails")}</span>
              </div>
              <p className="text-[11px] text-[#5A6478]">
                {t("settings.technicalDetailsDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleTelemetry(!showTelemetry)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer shrink-0 ${
                showTelemetry ? "bg-[#E85D42]" : "bg-[#DDD5C4]"
              }`}
              aria-label={t("settings.technicalDetails")}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  showTelemetry ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-[#EBE5D8] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#E85D42] hover:bg-[#D14328] text-white text-xs font-bold shadow-warm-sm transition-all cursor-pointer"
          >
            {t("settings.close")}
          </button>
        </div>
      </div>
    </div>
  );
};
