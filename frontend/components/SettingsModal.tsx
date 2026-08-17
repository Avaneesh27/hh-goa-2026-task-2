"use client";

import React, { useEffect } from "react";
import { X, Globe, Volume2, EyeOff, Sliders, Check } from "lucide-react";
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
  const { t, selectedLanguage, setLanguage, languages } = useTranslation();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Modal Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated p-6 sm:p-7 shadow-2xl z-10 border border-white/15 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-100">
              {t("settings.title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl glass-button text-slate-400 hover:text-white"
            aria-label={t("settings.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-5 text-xs sm:text-sm">
          {/* 1. Language Preference (All 15 languages) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-slate-200 font-bold">
              <Globe className="w-4 h-4 text-brand-400" />
              <span>{t("settings.language")}</span>
            </label>
            <p className="text-[11px] text-slate-400 leading-normal">
              {t("settings.languageDesc")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
              {languages.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                      isSelected
                        ? "bg-brand-600/25 border-brand-500 text-white font-bold shadow-md shadow-brand-500/15 ring-1 ring-brand-400"
                        : "glass-panel-subtle text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="font-semibold text-xs text-slate-100 truncate">{lang.nativeName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{lang.name}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Auto-play Voice Narration Toggle */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel-subtle">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Volume2 className="w-4 h-4 text-brand-400" />
                <span>{t("settings.autoplay")}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {t("settings.autoplayDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleAutoPlay(!autoPlayEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                autoPlayEnabled ? "bg-brand-600" : "bg-slate-800"
              }`}
              aria-label={t("settings.autoplay")}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoPlayEnabled ? "translate-x-5 shadow-md" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 3. Reduced Motion Toggle */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel-subtle">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <EyeOff className="w-4 h-4 text-brand-400" />
                <span>{t("settings.reducedMotion")}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {t("settings.reducedMotionDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleReducedMotion(!reducedMotion)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                reducedMotion ? "bg-brand-600" : "bg-slate-800"
              }`}
              aria-label={t("settings.reducedMotion")}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  reducedMotion ? "translate-x-5 shadow-md" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 4. Show Technical Telemetry Toggle */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel-subtle">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Sliders className="w-4 h-4 text-brand-400" />
                <span>{t("settings.technicalDetails")}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {t("settings.technicalDetailsDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleTelemetry(!showTelemetry)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                showTelemetry ? "bg-brand-600" : "bg-slate-800"
              }`}
              aria-label={t("settings.technicalDetails")}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  showTelemetry ? "translate-x-5 shadow-md" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Done Action */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
          >
            {t("settings.close")}
          </button>
        </div>
      </div>
    </div>
  );
};
