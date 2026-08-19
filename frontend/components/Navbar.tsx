"use client";

import React from "react";
import { Settings, HelpCircle, Github, Mic, Sun, Moon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
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
  const {
    t,
    interactionLanguage,
    setInteractionLanguage,
    languages,
  } = useTranslation();

  const { theme, toggleTheme, isThemeTransitioning } = useTheme();

  return (
    <header className="w-full border-b border-[#EBE5D8] dark:border-[#232E42] bg-[#FAF8F3]/90 dark:bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      {/* 85% Viewport Width Desktop Container */}
      <div className="w-[calc(100%-24px)] sm:w-[92%] lg:w-[85%] max-w-7xl mx-auto h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F06A50] to-[#E85D42] text-white flex items-center justify-center shadow-warm-sm border border-[#D14328]/30 shrink-0">
            <span className="font-bold text-sm tracking-tighter">HH</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-[#172033] dark:text-[#F8FAFC]">
                {t("app.title")}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 text-[#D14328] dark:text-[#F8876B] border border-[#FFD7CD] dark:border-[#FFD7CD]/20 tracking-wide">
                {t("app.badge")}
              </span>
            </div>
            <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8] hidden sm:block font-normal">
              {t("app.subtitle")}
            </p>
          </div>
        </div>

        {/* Right Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Indexed Chunks Product Fact Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-warm-sm text-xs">
            <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="text-[#5A6478] dark:text-[#94A3B8] font-mono text-[11px] font-semibold">
              {health
                ? `${health.indexed_chunks.toLocaleString()} ${t("app.health.connected")}`
                : t("app.health.connecting")}
            </span>
          </div>

          {/* How It Works Button */}
          <button
            onClick={onOpenHowItWorks}
            className="px-3 py-1.5 rounded-xl paper-button text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] flex items-center gap-1.5"
            title={t("nav.howItWorks")}
            aria-label={t("nav.howItWorks")}
          >
            <HelpCircle className="w-4 h-4 text-[#E85D42]" />
            <span className="hidden sm:inline">{t("nav.howItWorks")}</span>
          </button>

          {/* Voice Interaction Language Selector Dropdown (Controls interactionLanguage ONLY) */}
          <div
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-warm-sm text-xs text-[#172033] dark:text-[#F8FAFC]"
            title={t("voiceLanguageDesc") || "Voice Interaction Language"}
          >
            <Mic className="w-3.5 h-3.5 text-[#E85D42] shrink-0" />
            <span className="text-[11px] font-bold text-[#E85D42] hidden sm:inline">
              Voice:
            </span>
            <select
              value={interactionLanguage}
              onChange={(e) => setInteractionLanguage(e.target.value)}
              disabled={disabled}
              className="bg-transparent text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer pr-1"
              aria-label="Voice Interaction Language"
            >
              {languages.map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  className="bg-[#FFFFFF] dark:bg-[#1E293B] text-[#172033] dark:text-[#F8FAFC] font-medium py-1"
                >
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle Button (Sun ☀ / Moon ☾) */}
          <button
            onClick={toggleTheme}
            disabled={isThemeTransitioning}
            className="p-2 rounded-xl paper-button text-[#E85D42] hover:text-[#D14328] dark:text-[#FBBF24] dark:hover:text-[#FDE047] transition-colors cursor-pointer"
            title={theme === "light" ? "Switch to Night (Dark Mode)" : "Switch to Day (Light Mode)"}
            aria-label={theme === "light" ? "Switch to Night (Dark Mode)" : "Switch to Day (Light Mode)"}
          >
            {theme === "light" ? (
              <Sun className="w-4 h-4 text-[#E85D42] hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-[#FBBF24] hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl paper-button text-[#5A6478] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]"
            title={t("nav.settings")}
            aria-label={t("nav.settings")}
          >
            <Settings className="w-4 h-4 hover:rotate-45 transition-transform" />
          </button>

          {/* Source Code Link */}
          <a
            href="https://github.com/Avaneesh27/hh-goa-2026-task-2"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl paper-button text-[#5A6478] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]"
            title="GitHub"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
