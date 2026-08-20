"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  HelpCircle,
  Github,
  Mic,
  Sun,
  Moon,
  Menu,
  X,
  Globe,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
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

  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on ESC key or window resize to desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const currentLangObj = languages.find((l) => l.code === interactionLanguage) || languages[0];

  return (
    <header className="w-full border-b border-[#EBE5D8] dark:border-[#232E42] bg-[#FAF8F3]/95 dark:bg-[#0B0F19]/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      {/* Responsive Container */}
      <div className="w-[94%] sm:w-[90%] md:w-[85%] lg:w-[80%] max-w-[1440px] mx-auto h-[72px] flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E85D42] dark:bg-[#F06A50] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            <span className="font-bold text-sm tracking-tighter">HH</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#172033] dark:text-[#F8FAFC]">
                {t("app.title")}
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#FAF8F3] dark:bg-[#161F30] text-[#E85D42] dark:text-[#F06A50] border border-[#EBE5D8] dark:border-[#232E42] tracking-wider shrink-0">
                {t("app.badge")}
              </span>
            </div>
            <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8] hidden sm:block font-normal truncate max-w-xs">
              {t("app.subtitle")}
            </p>
          </div>
        </div>

        {/* Desktop Navigation & Controls (Visible on Desktop >= 1024px) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Indexed Chunks Product Fact Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-warm-sm text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="text-[#5A6478] dark:text-[#94A3B8] font-mono text-xs font-semibold">
              {health
                ? `${health.indexed_chunks.toLocaleString()} ${t("app.health.connected")}`
                : t("app.health.connecting")}
            </span>
          </div>

          {/* How It Works Button */}
          <button
            onClick={onOpenHowItWorks}
            className="px-3.5 py-2 rounded-xl paper-button text-sm font-semibold text-[#172033] dark:text-[#F8FAFC] flex items-center gap-2 cursor-pointer"
            title={t("nav.howItWorks")}
            aria-label={t("nav.howItWorks")}
          >
            <HelpCircle className="w-[18px] h-[18px] text-[#E85D42]" />
            <span>{t("nav.howItWorks")}</span>
          </button>

          {/* Voice Interaction Language Selector Dropdown */}
          <div
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-warm-sm text-xs text-[#172033] dark:text-[#F8FAFC]"
            title={t("voiceLanguageDesc") || "Voice Interaction Language"}
          >
            <Mic className="w-4 h-4 text-[#E85D42] shrink-0" />
            <span className="text-xs font-bold text-[#E85D42]">
              Voice:
            </span>
            <select
              value={interactionLanguage}
              onChange={(e) => setInteractionLanguage(e.target.value)}
              disabled={disabled}
              className="bg-transparent text-sm font-semibold text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer pr-1"
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
            className="p-2.5 rounded-xl paper-button text-[#E85D42] hover:text-[#D14328] dark:text-[#FBBF24] dark:hover:text-[#FDE047] cursor-pointer"
            title={theme === "light" ? "Switch to Night (Dark Mode)" : "Switch to Day (Light Mode)"}
            aria-label={theme === "light" ? "Switch to Night (Dark Mode)" : "Switch to Day (Light Mode)"}
          >
            {theme === "light" ? (
              <Sun className="w-[18px] h-[18px] text-[#E85D42]" />
            ) : (
              <Moon className="w-[18px] h-[18px] text-[#FBBF24]" />
            )}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl paper-button text-[#5A6478] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC] cursor-pointer"
            title={t("nav.settings")}
            aria-label={t("nav.settings")}
          >
            <Settings className="w-[18px] h-[18px] hover:rotate-45 transition-transform" />
          </button>

          {/* Source Code Link */}
          <a
            href="https://github.com/Avaneesh27/hh-goa-2026-task-2"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl paper-button text-[#5A6478] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]"
            title="GitHub"
            aria-label="GitHub"
          >
            <Github className="w-[18px] h-[18px]" />
          </a>
        </div>

        {/* Mobile & Tablet Header Controls (Visible on < 1024px) */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Quick Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl paper-button text-[#E85D42] dark:text-[#FBBF24] cursor-pointer"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Sun className="w-5 h-5 text-[#E85D42]" />
            ) : (
              <Moon className="w-5 h-5 text-[#FBBF24]" />
            )}
          </button>

          {/* Burger Lines / Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            id="mobile-burger-menu-btn"
            className="p-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-[#172033] dark:text-[#F8FAFC] shadow-warm-sm hover:border-[#E85D42] dark:hover:border-[#F06A50] transition-all cursor-pointer"
            title={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-[#E85D42] transition-transform rotate-90 duration-200" />
            ) : (
              <Menu className="w-6 h-6 text-[#172033] dark:text-[#F8FAFC] transition-transform duration-200" />
            )}
          </button>
        </div>
      </div>

      {/* Android & Mobile Navigation Drawer / Slide-Down Sheet */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[72px] bottom-0 z-50 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-h-[calc(100vh-72px)] overflow-y-auto bg-[#FAF8F3] dark:bg-[#0B0F19] border-b border-[#EBE5D8] dark:border-[#232E42] shadow-2xl p-5 sm:p-6 space-y-5 animate-slideDown">
            {/* Live Health Badge */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-warm-xs">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] animate-pulse" />
                <span className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC]">
                  Vector Knowledge Base
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#DCFCE7] dark:bg-[#14532D]/30 text-[#16A34A] dark:text-[#4ADE80] border border-[#BBF7D0] dark:border-[#14532D]">
                {health ? `${health.indexed_chunks.toLocaleString()} Chunks Live` : "Connecting"}
              </span>
            </div>

            {/* Voice Interaction Language Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#5A6478] dark:text-[#94A3B8] flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-[#E85D42]" />
                  <span>Voice Interaction Language</span>
                </span>
                <span className="text-xs font-bold text-[#E85D42]">
                  {currentLangObj.nativeName}
                </span>
              </div>

              {/* Language Grid for Android touch */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {languages.map((lang) => {
                  const isSelected = interactionLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setInteractionLanguage(lang.code);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-center transition-all ${
                        isSelected
                          ? "bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 border-[#E85D42] text-[#D14328] dark:text-[#F8876B] shadow-sm font-bold"
                          : "bg-[#FFFFFF] dark:bg-[#161F30] border-[#EBE5D8] dark:border-[#232E42] text-[#172033] dark:text-[#F8FAFC] hover:border-[#DDD5C4]"
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight">
                        {lang.nativeName}
                      </span>
                      <span className="text-[10px] text-[#8B95A5] dark:text-[#64748B] truncate">
                        {lang.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Navigation Action Tiles */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#EBE5D8] dark:border-[#232E42]">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenHowItWorks();
                }}
                className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-xs sm:text-sm font-bold text-[#172033] dark:text-[#F8FAFC] flex items-center gap-2.5 shadow-warm-xs hover:border-[#E85D42]"
              >
                <HelpCircle className="w-5 h-5 text-[#E85D42] shrink-0" />
                <span>How It Works</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-xs sm:text-sm font-bold text-[#172033] dark:text-[#F8FAFC] flex items-center gap-2.5 shadow-warm-xs hover:border-[#E85D42]"
              >
                <Settings className="w-5 h-5 text-[#3B82F6] shrink-0" />
                <span>Settings</span>
              </button>
            </div>

            {/* GitHub and External Links */}
            <div className="pt-2">
              <a
                href="https://github.com/Avaneesh27/hh-goa-2026-task-2"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-xs sm:text-sm font-bold text-[#172033] dark:text-[#F8FAFC] flex items-center justify-between shadow-warm-xs hover:border-[#172033]"
              >
                <div className="flex items-center gap-2.5">
                  <Github className="w-5 h-5" />
                  <span>GitHub Repository</span>
                </div>
                <ExternalLink className="w-4 h-4 text-[#8B95A5]" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
