"use client";

import React from "react";
import { Sparkles, Globe, Settings, HelpCircle, Github, Database } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { HealthInfo } from "@/types/rag";

interface NavbarProps {
  health: HealthInfo | null;
  onOpenSettings: () => void;
  onOpenHowItWorks: () => void;
  disabled?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onOpenSettings,
  onOpenHowItWorks,
  disabled = false,
}) => {
  const { t, selectedLanguage, setLanguage, languages } = useTranslation();

  return (
    <header className="border-b border-white/5 bg-[#030712]/75 backdrop-blur-2xl sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white">
                {t("app.title")}
              </span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/25 tracking-wide">
                {t("app.badge")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              {t("app.subtitle")}
            </p>
          </div>
        </div>

        {/* Right Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Indexed chunks badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-pill text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-mono text-[11px] font-medium">
              {health
                ? `${health.indexed_chunks.toLocaleString()} ${t("app.health.connected")}`
                : t("app.health.connecting")}
            </span>
          </div>

          {/* How It Works Button */}
          <button
            onClick={onOpenHowItWorks}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl glass-button text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
            title={t("nav.howItWorks")}
            aria-label={t("nav.howItWorks")}
          >
            <HelpCircle className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline font-medium">{t("nav.howItWorks")}</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-pill text-xs text-slate-200">
            <Globe className="w-4 h-4 text-brand-400 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={disabled}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
              aria-label={t("settings.language")}
            >
              {languages.map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  className="bg-slate-900 text-slate-100 font-medium py-1"
                >
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl glass-button text-slate-300 hover:text-white"
            title={t("nav.settings")}
            aria-label={t("nav.settings")}
          >
            <Settings className="w-4 h-4 text-slate-300 hover:rotate-45 transition-transform" />
          </button>

          {/* GitHub Source Link */}
          <a
            href="https://github.com/Avaneesh27/hh-goa-2026-task-2"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl glass-button text-slate-400 hover:text-white hidden sm:flex items-center"
            title="GitHub Repository"
            aria-label="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
