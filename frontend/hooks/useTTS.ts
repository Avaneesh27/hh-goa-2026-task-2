"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ttsService, cleanTextForNarration, TTSOptions } from "@/lib/tts";

export type TTSStatus = "idle" | "playing" | "paused" | "stopped" | "requiresGesture" | "error";

const AUTOPLAY_STORAGE_KEY = "hh_voice_rag_autoplay";

export function useTTS(initialText: string = "", initialLanguage: string = "en") {
  const [status, setStatus] = useState<TTSStatus>("idle");
  const [autoPlayEnabled, setAutoPlayEnabledState] = useState<boolean>(true);
  const [currentText, setCurrentText] = useState<string>(initialText);
  const [currentLang, setCurrentLang] = useState<string>(initialLanguage);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load autoplay preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOPLAY_STORAGE_KEY);
      if (saved !== null) {
        setAutoPlayEnabledState(saved === "true");
      }
    } catch (_) {}

    const markInteraction = () => setHasInteracted(true);
    window.addEventListener("click", markInteraction, { once: true });
    window.addEventListener("keydown", markInteraction, { once: true });
    window.addEventListener("touchstart", markInteraction, { once: true });

    return () => {
      window.removeEventListener("click", markInteraction);
      window.removeEventListener("keydown", markInteraction);
      window.removeEventListener("touchstart", markInteraction);
      ttsService.stop();
    };
  }, []);

  const setAutoPlayEnabled = useCallback((enabled: boolean) => {
    setAutoPlayEnabledState(enabled);
    try {
      localStorage.setItem(AUTOPLAY_STORAGE_KEY, String(enabled));
    } catch (_) {}
  }, []);

  const play = useCallback(
    (textToSpeak?: string, langCode?: string) => {
      const targetText = textToSpeak !== undefined ? textToSpeak : currentText;
      const targetLang = langCode !== undefined ? langCode : currentLang;

      if (!targetText || !targetText.trim()) return;

      setCurrentText(targetText);
      if (langCode) setCurrentLang(targetLang);
      setError(null);

      const options: TTSOptions = {
        onStart: () => setStatus("playing"),
        onEnd: () => setStatus("idle"),
        onPause: () => setStatus("paused"),
        onResume: () => setStatus("playing"),
        onError: (err) => {
          console.warn("TTS narration notice:", err);
          setStatus("error");
          setError("Failed to narrate answer audio.");
        },
      };

      const started = ttsService.speak(targetText, targetLang, options);
      if (started) {
        setStatus("playing");
      } else {
        setStatus("idle");
      }
    },
    [currentText, currentLang]
  );

  const pause = useCallback(() => {
    ttsService.pause();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    ttsService.resume();
    setStatus("playing");
  }, []);

  const stop = useCallback(() => {
    ttsService.stop();
    setStatus("stopped");
  }, []);

  const replay = useCallback(() => {
    play(currentText, currentLang);
  }, [play, currentText, currentLang]);

  // Handler for automatic narration when an answer is delivered
  const narrateAnswer = useCallback(
    (answerText: string, lang: string) => {
      setCurrentText(answerText);
      setCurrentLang(lang);

      if (!autoPlayEnabled) return;

      // If user hasn't interacted yet, browser might block autoplay
      if (!hasInteracted && typeof navigator !== "undefined" && (navigator as any).userActivation && !(navigator as any).userActivation.hasBeenActive) {
        setStatus("requiresGesture");
        return;
      }

      play(answerText, lang);
    },
    [autoPlayEnabled, hasInteracted, play]
  );

  return {
    status,
    isPlaying: status === "playing",
    isPaused: status === "paused",
    autoPlayEnabled,
    setAutoPlayEnabled,
    play,
    pause,
    resume,
    replay,
    stop,
    narrateAnswer,
    error,
    isSupported: ttsService.isSupported(),
  };
}
