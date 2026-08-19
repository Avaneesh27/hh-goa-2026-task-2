"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeMode = "light" | "dark";
export type TransitionPhase = "idle" | "entering" | "covered" | "leaving";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setThemeDirectly: (mode: ThemeMode) => void;
  isThemeTransitioning: boolean;
  transitionType: "to-dark" | "to-light" | null;
  transitionPhase: TransitionPhase;
}

const THEME_STORAGE_KEY = "hhgoa_theme";

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isThemeTransitioning, setIsThemeTransitioning] = useState<boolean>(false);
  const [transitionType, setTransitionType] = useState<"to-dark" | "to-light" | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle");

  // Load saved theme from localStorage or system preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
        applyThemeClass(savedTheme);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: ThemeMode = prefersDark ? "dark" : "light";
        setThemeState(initialTheme);
        applyThemeClass(initialTheme);
      }
    } catch (_) {}
  }, []);

  const applyThemeClass = (mode: ThemeMode) => {
    if (typeof document === "undefined") return;
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const setThemeDirectly = (mode: ThemeMode) => {
    setThemeState(mode);
    applyThemeClass(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (_) {}
  };

  const toggleTheme = () => {
    // Prevent overlapping transitions while one is running
    if (isThemeTransitioning) return;

    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    const type = theme === "light" ? "to-dark" : "to-light";

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setThemeDirectly(nextTheme);
      return;
    }

    // Begin cinematic sunset / moonrise transition sequence
    setIsThemeTransitioning(true);
    setTransitionType(type);
    setTransitionPhase("entering");

    // Phase 1: Clouds enter from both sides (0.0s - 0.65s)
    // Phase 2: Screen fully covered & Sun/Moon horizon crossing (0.65s - 0.75s)
    setTimeout(() => {
      setTransitionPhase("covered");
      // Switch underlying theme under cloud cover
      setThemeState(nextTheme);
      applyThemeClass(nextTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (_) {}
    }, 700);

    // Phase 3: Clouds part and move away revealing the new theme (0.75s - 1.45s)
    setTimeout(() => {
      setTransitionPhase("leaving");
    }, 850);

    // Phase 4: Transition complete, reset overlay state (1.55s)
    setTimeout(() => {
      setIsThemeTransitioning(false);
      setTransitionType(null);
      setTransitionPhase("idle");
    }, 1550);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setThemeDirectly,
        isThemeTransitioning,
        transitionType,
        transitionPhase,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
