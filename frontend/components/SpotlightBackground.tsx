"use client";

import React from "react";

interface SpotlightBackgroundProps {
  reducedMotion?: boolean;
  appState?: "idle" | "listening" | "processing" | "ready";
}

export const SpotlightBackground: React.FC<SpotlightBackgroundProps> = ({
  reducedMotion = false,
}) => {
  if (reducedMotion) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Subtle Architectural Dot Matrix Canvas */}
      <div className="absolute inset-0 bg-stipple opacity-40 dark:opacity-30" />

      {/* 2. Soft Top Lighting Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-[#FAF5EC]/80 dark:from-[#1E293B]/20 to-transparent pointer-events-none" />
    </div>
  );
};
