"use client";

import React from "react";
import { Play, Pause, RotateCcw, Square, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { TTSStatus } from "@/hooks/useTTS";

interface AudioPlayerBarProps {
  status: TTSStatus;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onReplay: () => void;
  onStop: () => void;
  isSupported: boolean;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  status,
  onPlay,
  onPause,
  onResume,
  onReplay,
  onStop,
  isSupported,
}) => {
  const { t } = useTranslation();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-pill text-xs text-slate-500">
        <VolumeX className="w-3.5 h-3.5" />
        <span>{t("tts.unsupported")}</span>
      </div>
    );
  }

  const isPlaying = status === "playing";
  const isPaused = status === "paused";
  const requiresGesture = status === "requiresGesture";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl glass-panel-subtle border border-brand-500/20 shadow-inner">
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isPlaying ? "bg-brand-600 text-white shadow-md shadow-brand-500/30 animate-pulse" : "bg-slate-800/80 text-brand-400"}`}>
          <Volume2 className="w-4 h-4" />
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-200">
            {requiresGesture
              ? t("tts.tapToPlay")
              : isPlaying
              ? t("tts.playing")
              : isPaused
              ? t("tts.paused")
              : t("tts.listen")}
          </span>
          {/* Mini audio waveform equalizer */}
          {isPlaying && (
            <div className="flex items-center gap-1 mt-1">
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-brand-500 via-indigo-400 to-cyan-300 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                  style={{
                    height: `${7 + (i % 3) * 5}px`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Control Action Buttons */}
      <div className="flex items-center gap-1.5">
        {isPlaying ? (
          <>
            <button
              onClick={onPause}
              className="px-3 py-1.5 rounded-xl glass-button text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1"
              title={t("tts.pause")}
              aria-label={t("tts.pause")}
            >
              <Pause className="w-3.5 h-3.5" />
              <span>{t("tts.pause")}</span>
            </button>
            <button
              onClick={onStop}
              className="p-1.5 rounded-xl glass-button text-xs text-rose-400 hover:text-rose-300"
              title={t("tts.stop")}
              aria-label={t("tts.stop")}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </>
        ) : isPaused ? (
          <>
            <button
              onClick={onResume}
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-brand-500/20 active:scale-95"
              title={t("tts.resume")}
              aria-label={t("tts.resume")}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t("tts.resume")}</span>
            </button>
            <button
              onClick={onReplay}
              className="p-1.5 rounded-xl glass-button text-xs text-slate-300 hover:text-white"
              title={t("tts.replay")}
              aria-label={t("tts.replay")}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={onPlay}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-500/25 active:scale-95 transition-all"
            title={t("tts.listen")}
            aria-label={t("tts.listen")}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{requiresGesture ? t("tts.tapToPlay") : t("tts.listen")}</span>
          </button>
        )}
      </div>
    </div>
  );
};
