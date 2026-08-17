"use client";

import React, { useEffect, useRef } from "react";

interface SpotlightBackgroundProps {
  reducedMotion?: boolean;
}

export const SpotlightBackground: React.FC<SpotlightBackgroundProps> = ({ reducedMotion = false }) => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: typeof window !== "undefined" ? window.innerHeight / 2 : 0 });
  const currentPos = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: typeof window !== "undefined" ? window.innerHeight / 2 : 0 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    // Check if touch device
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    const updatePosition = () => {
      // Smooth interpolation (lerp)
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.15;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.15;

      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty("--mouse-x", `${currentPos.current.x}px`);
        spotlightRef.current.style.setProperty("--mouse-y", `${currentPos.current.y}px`);
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

  return (
    <div
      ref={spotlightRef}
      className="spotlight-overlay pointer-events-none fixed inset-0 -z-10 transition-opacity duration-500"
      aria-hidden="true"
    >
      {/* Ambient background soft orbs */}
      <div className="absolute top-1/4 left-1/5 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[140px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/5 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none transform translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-2/3 left-1/2 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none transform -translate-x-1/2" />
    </div>
  );
};
