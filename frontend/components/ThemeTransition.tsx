"use client";

import React from "react";
import { useTheme } from "@/lib/theme";

export const ThemeTransition: React.FC = () => {
  const { isThemeTransitioning, transitionType, transitionPhase } = useTheme();

  if (!isThemeTransitioning || !transitionType) return null;

  const isEntering = transitionPhase === "entering";
  const isCovered = transitionPhase === "covered";
  const isLeaving = transitionPhase === "leaving";
  const isToDark = transitionType === "to-dark";

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Background Atmosphere Backdrop that darkens / lightens smoothly */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          isCovered || (isLeaving && isToDark)
            ? "bg-[#0B0F19] opacity-100"
            : isCovered || (isLeaving && !isToDark)
            ? "bg-[#FAF8F3] opacity-100"
            : isToDark
            ? "bg-[#1E293B]/60 opacity-80"
            : "bg-[#FDF6E2]/60 opacity-80"
        }`}
      />

      {/* Sun and Moon Celestial Horizon Stage */}
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-48 h-48 flex items-center justify-center pointer-events-none z-10">
        {/* Sun Element */}
        <div
          className={`absolute w-28 h-28 rounded-full bg-gradient-to-tr from-[#F59E0B] via-[#FBBF24] to-[#FEF08A] shadow-[0_0_60px_rgba(245,158,11,0.6)] flex items-center justify-center transition-all duration-700 ease-in-out ${
            isToDark
              ? isEntering
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-40 opacity-0 scale-75"
              : isEntering
              ? "translate-y-40 opacity-0 scale-75"
              : "translate-y-0 opacity-100 scale-100"
          }`}
        >
          {/* Subtle Sun Rays */}
          <div className="w-20 h-20 rounded-full bg-[#FEF3C7]/40 animate-ping opacity-30" />
        </div>

        {/* Moon Element */}
        <div
          className={`absolute w-24 h-24 rounded-full bg-gradient-to-br from-[#F1F5F9] via-[#E2E8F0] to-[#94A3B8] shadow-[0_0_50px_rgba(226,232,240,0.5)] flex items-center justify-center transition-all duration-700 ease-in-out ${
            isToDark
              ? isEntering
                ? "translate-y-40 opacity-0 scale-75"
                : "translate-y-0 opacity-100 scale-100"
              : isEntering
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-40 opacity-0 scale-75"
          }`}
        >
          {/* Moon Surface Craters */}
          <div className="absolute top-4 left-6 w-4 h-4 rounded-full bg-[#CBD5E1]/60" />
          <div className="absolute bottom-6 right-5 w-5 h-5 rounded-full bg-[#CBD5E1]/50" />
          <div className="absolute top-10 right-8 w-2.5 h-2.5 rounded-full bg-[#CBD5E1]/40" />
        </div>
      </div>

      {/* Cloud Groups (3 Distinct Organic Layers) */}

      {/* Layer 1: Far Clouds (Backdrop, Slow Speed) */}
      <div
        className={`absolute inset-0 transition-transform duration-700 ease-out ${
          isEntering || isCovered
            ? "translate-x-0"
            : isLeaving
            ? "scale-105 opacity-0"
            : "opacity-0"
        }`}
      >
        {/* Left Far Cloud */}
        <div
          className={`absolute top-[10%] -left-12 w-[65vw] h-[55vh] rounded-full filter blur-xl transition-all duration-700 ${
            isToDark ? "bg-[#334155]/80" : "bg-[#FED7AA]/80"
          } ${
            isEntering
              ? "translate-x-0 opacity-80"
              : isLeaving
              ? "-translate-x-[100vw] opacity-0"
              : "opacity-90"
          }`}
        />
        {/* Right Far Cloud */}
        <div
          className={`absolute bottom-[15%] -right-16 w-[70vw] h-[60vh] rounded-full filter blur-xl transition-all duration-700 ${
            isToDark ? "bg-[#1E293B]/90" : "bg-[#FEF3C7]/90"
          } ${
            isEntering
              ? "translate-x-0 opacity-80"
              : isLeaving
              ? "translate-x-[100vw] opacity-0"
              : "opacity-90"
          }`}
        />
      </div>

      {/* Layer 2: Mid Clouds (Main Body Silhouettes) */}
      <div className="absolute inset-0">
        {/* Left Mid Cloud Group */}
        <div
          className={`absolute top-0 -left-10 w-[70vw] h-full transition-transform duration-700 ease-in-out ${
            isEntering
              ? "translate-x-0"
              : isCovered
              ? "translate-x-0"
              : isLeaving
              ? "-translate-x-[105vw]"
              : "-translate-x-[105vw]"
          }`}
        >
          <svg
            viewBox="0 0 800 900"
            fill="none"
            className={`w-full h-full transition-colors duration-700 ${
              isToDark && (isCovered || isLeaving)
                ? "text-[#1E293B]"
                : !isToDark && (isCovered || isLeaving)
                ? "text-[#FDF6E2]"
                : isToDark
                ? "text-[#64748B]"
                : "text-[#FDE8E0]"
            }`}
          >
            <path
              d="M0 0 H550 C620 50 680 140 650 240 C730 300 760 410 700 510 C770 600 750 720 670 790 C620 840 560 880 480 900 H0 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Right Mid Cloud Group */}
        <div
          className={`absolute top-0 -right-10 w-[70vw] h-full transition-transform duration-700 ease-in-out ${
            isEntering
              ? "translate-x-0"
              : isCovered
              ? "translate-x-0"
              : isLeaving
              ? "translate-x-[105vw]"
              : "translate-x-[105vw]"
          }`}
        >
          <svg
            viewBox="0 0 800 900"
            fill="none"
            className={`w-full h-full transition-colors duration-700 ${
              isToDark && (isCovered || isLeaving)
                ? "text-[#0F172A]"
                : !isToDark && (isCovered || isLeaving)
                ? "text-[#FAF8F3]"
                : isToDark
                ? "text-[#475569]"
                : "text-[#FED7AA]"
            }`}
          >
            <path
              d="M800 0 H250 C180 60 120 150 150 250 C70 310 40 420 100 520 C30 610 50 730 130 800 C180 850 240 885 320 900 H800 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Layer 3: Front Clouds (Dense Foreground Billowing Cover) */}
      <div className="absolute inset-0 z-20">
        {/* Left Front Cloud */}
        <div
          className={`absolute -bottom-10 -left-10 w-[65vw] h-[75vh] transition-transform duration-700 ease-out ${
            isEntering
              ? "translate-x-0"
              : isCovered
              ? "translate-x-0"
              : isLeaving
              ? "-translate-x-[110vw]"
              : "-translate-x-[110vw]"
          }`}
        >
          <svg
            viewBox="0 0 700 700"
            fill="none"
            className={`w-full h-full transition-colors duration-700 ${
              isToDark && (isCovered || isLeaving)
                ? "text-[#0B0F19]"
                : !isToDark && (isCovered || isLeaving)
                ? "text-[#FFFFFF]"
                : isToDark
                ? "text-[#1E293B]"
                : "text-[#FFFBF5]"
            }`}
          >
            <path
              d="M0 700 V200 C80 180 170 210 220 280 C290 220 400 240 450 320 C530 330 590 410 570 500 C630 560 620 650 560 700 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Right Front Cloud */}
        <div
          className={`absolute -top-10 -right-10 w-[65vw] h-[75vh] transition-transform duration-700 ease-out ${
            isEntering
              ? "translate-x-0"
              : isCovered
              ? "translate-x-0"
              : isLeaving
              ? "translate-x-[110vw]"
              : "translate-x-[110vw]"
          }`}
        >
          <svg
            viewBox="0 0 700 700"
            fill="none"
            className={`w-full h-full transition-colors duration-700 ${
              isToDark && (isCovered || isLeaving)
                ? "text-[#0B0F19]"
                : !isToDark && (isCovered || isLeaving)
                ? "text-[#FFFFFF]"
                : isToDark
                ? "text-[#1E293B]"
                : "text-[#FFFBF5]"
            }`}
          >
            <path
              d="M700 0 V500 C620 520 530 490 480 420 C410 480 300 460 250 380 C170 370 110 290 130 200 C70 140 80 50 140 0 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
