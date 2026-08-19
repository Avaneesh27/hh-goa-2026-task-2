"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

interface SpotlightBackgroundProps {
  reducedMotion?: boolean;
  appState?: "idle" | "listening" | "processing" | "ready";
}

export const SpotlightBackground: React.FC<SpotlightBackgroundProps> = ({
  reducedMotion = false,
  appState = "idle",
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });
  const currentPos = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    // Check if touch device
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      // Calculate normalized offset from center for mouse parallax (-1 to 1)
      const normX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const normY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      setMouseParallax({ x: normX * 12, y: normY * 12 });
    };

    const updatePosition = () => {
      // Smooth interpolation for subtle ambient cursor follow
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.08;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.08;

      if (containerRef.current) {
        containerRef.current.style.setProperty("--cursor-light-x", `${currentPos.current.x}px`);
        containerRef.current.style.setProperty("--cursor-light-y", `${currentPos.current.y}px`);
      }

      animFrameId.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animFrameId.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  const isListening = appState === "listening";
  const isProcessing = appState === "processing";

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none transition-colors duration-500"
      aria-hidden="true"
    >
      {/* 1. Stipple Texture Canvas */}
      <div className="absolute inset-0 bg-stipple opacity-60" />

      {/* 2. Soft Ambient Cursor Glow */}
      <div className="warm-cursor-glow" />

      {/* 3. Floating Organic Atmospheric Blobs */}
      {/* Top-Left Blob */}
      <div
        className={`absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full blur-3xl transition-all duration-700 ${
          isDark
            ? "bg-gradient-to-br from-[#312E81]/30 via-[#1E1B4B]/20 to-transparent"
            : "bg-gradient-to-br from-[#FFE8DE]/60 via-[#FED7AA]/40 to-transparent"
        } ${
          isListening
            ? "scale-110 opacity-90 from-[#FFD7CD]/80 dark:from-[#4338CA]/40"
            : "animate-float-slow opacity-60"
        }`}
        style={{
          transform: `translate(${-mouseParallax.x * 0.8}px, ${-mouseParallax.y * 0.8}px)`,
        }}
      />

      {/* Top-Right Blob */}
      <div
        className={`absolute top-12 -right-20 w-[420px] h-[420px] rounded-full blur-3xl transition-all duration-700 ${
          isDark
            ? "bg-gradient-to-bl from-[#1E293B]/40 via-[#0F172A]/30 to-transparent"
            : "bg-gradient-to-bl from-[#FEF3C7]/70 via-[#FDE68A]/35 to-transparent"
        } ${
          isProcessing
            ? "scale-115 opacity-80 from-[#FDE68A]/80 dark:from-[#38BDF8]/20"
            : "animate-float-reverse opacity-55"
        }`}
        style={{
          transform: `translate(${mouseParallax.x * 0.6}px, ${mouseParallax.y * 0.6}px)`,
        }}
      />

      {/* Bottom-Left Blob */}
      <div
        className={`absolute bottom-10 -left-16 w-[440px] h-[440px] rounded-full blur-3xl animate-float-reverse opacity-50 transition-all duration-700 ${
          isDark
            ? "bg-gradient-to-tr from-[#1E1B4B]/35 via-[#0F172A]/20 to-transparent"
            : "bg-gradient-to-tr from-[#DCFCE7]/50 via-[#E0F2FE]/40 to-transparent"
        }`}
        style={{
          transform: `translate(${mouseParallax.x * 0.5}px, ${-mouseParallax.y * 0.5}px)`,
        }}
      />

      {/* Bottom-Right Blob */}
      <div
        className={`absolute -bottom-20 -right-16 w-[500px] h-[500px] rounded-full blur-3xl animate-float-slow opacity-50 transition-all duration-700 ${
          isDark
            ? "bg-gradient-to-tl from-[#1E293B]/40 via-[#111827]/30 to-transparent"
            : "bg-gradient-to-tl from-[#FFEDD5]/60 via-[#FEE2E2]/30 to-transparent"
        }`}
        style={{
          transform: `translate(${-mouseParallax.x * 0.7}px, ${mouseParallax.y * 0.7}px)`,
        }}
      />
    </div>
  );
};
