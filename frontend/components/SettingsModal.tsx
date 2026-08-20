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
      <div className="relative w-full max-w-lg rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] p-6 sm:p-7 shadow-xl z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#EBE5D8] dark:border-[#232E42]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 flex items-center justify-center text-[#E85D42] dark:text-[#F8876B]">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#172033] dark:text-[#F8FAFC]">
              {t("settings.title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg paper-button text-[#5A6478] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]"
            aria-label={t("settings.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-3.5 text-xs sm:text-sm">
          {/* Section: Whole Website Language */}
          <div className="p-4 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] space-y-3">
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
                className="w-full px-3 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] shadow-sm focus:outline-none focus:border-[#E85D42] cursor-pointer"
                aria-label={t("pageLanguage") || "Page Language"}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#FFFFFF] dark:bg-[#161F30] text-[#172033] dark:text-[#F8FAFC]">
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Sync Voice Language with Page Language Option */}
          <div className="p-4 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-[#172033] dark:text-[#F8FAFC]">
                <RefreshCw className="w-4 h-4 text-[#E85D42] dark:text-[#F8876B]" />
                <span>{t("syncLanguage") || "Sync Voice with Page"}</span>
              </div>
              <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8]">
                {t("syncLanguageDesc") ||
                  "Automatically switch voice interaction language whenever page language changes."}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={syncVoiceWithPage}
                onChange={(e) => setSyncVoiceWithPage(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#DDD5C4] dark:bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E85D42]"></div>
            </label>
          </div>

          {/* Section: TTS Auto-play */}
          <div className="p-4 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-[#172033] dark:text-[#F8FAFC]">
                <Volume2 className="w-4 h-4 text-[#E85D42] dark:text-[#F8876B]" />
                <span>{t("settings.autoplay")}</span>
              </div>
              <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8]">
                {t("settings.autoplayDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoPlayEnabled}
                onChange={(e) => onToggleAutoPlay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#DDD5C4] dark:bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E85D42]"></div>
            </label>
          </div>

          {/* Section: Telemetry / Execution Trace */}
          <div className="p-4 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-[#172033] dark:text-[#F8FAFC]">
                <Sliders className="w-4 h-4 text-[#E85D42] dark:text-[#F8876B]" />
                <span>{t("settings.telemetry")}</span>
              </div>
              <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8]">
                {t("settings.telemetryDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={showTelemetry}
                onChange={(e) => onToggleTelemetry(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#DDD5C4] dark:bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E85D42]"></div>
            </label>
          </div>

          {/* Section: Reduced Motion Accessibility */}
          <div className="p-4 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-[#172033] dark:text-[#F8FAFC]">
                <EyeOff className="w-4 h-4 text-[#E85D42] dark:text-[#F8876B]" />
                <span>{t("settings.motion")}</span>
              </div>
              <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8]">
                {t("settings.motionDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => onToggleReducedMotion(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#DDD5C4] dark:bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E85D42]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
