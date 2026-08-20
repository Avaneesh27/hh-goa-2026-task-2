"use client";

import React from "react";
import { Play, Pause, RotateCcw, Square, Volume2, VolumeX } from "lucide-react";
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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] text-xs text-[#8B95A5] dark:text-[#64748B]">
        <VolumeX className="w-3.5 h-3.5" />
        <span>{t("tts.unsupported")}</span>
      </div>
    );
  }

  const isPlaying = status === "playing";
  const isPaused = status === "paused";
  const requiresGesture = status === "requiresGesture";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            isPlaying
              ? "bg-[#E85D42] text-white"
              : "bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-[#E85D42] dark:text-[#F06A50]"
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC]">
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
                  className="w-1 rounded-full bg-[#E85D42] dark:bg-[#F06A50] animate-pulse"
                  style={{
                    height: `${5 + (i % 3) * 3}px`,
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
              className="px-2.5 py-1 rounded-md paper-button text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] flex items-center gap-1"
              title={t("tts.pause")}
              aria-label={t("tts.pause")}
            >
              <Pause className="w-3 h-3" />
              <span>{t("tts.pause")}</span>
            </button>
            <button
              onClick={onStop}
              className="p-1 rounded-md paper-button text-xs text-[#DC2626] hover:bg-[#FEE2E2] dark:hover:bg-[#991B1B]/30"
              title={t("tts.stop")}
              aria-label={t("tts.stop")}
            >
              <Square className="w-3 h-3" />
            </button>
          </>
        ) : isPaused ? (
          <>
            <button
              onClick={onResume}
              className="px-2.5 py-1 rounded-md btn-coral text-xs font-semibold flex items-center gap-1"
              title={t("tts.resume")}
              aria-label={t("tts.resume")}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Resume</span>
            </button>
            <button
              onClick={onReplay}
              className="p-1 rounded-md paper-button text-xs text-[#5A6478] dark:text-[#94A3B8]"
              title={t("tts.replay")}
              aria-label={t("tts.replay")}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </>
        ) : (
          <button
            onClick={onPlay}
            className="px-2.5 py-1 rounded-md btn-coral text-xs font-semibold flex items-center gap-1"
            title={t("tts.listen")}
            aria-label={t("tts.listen")}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{t("tts.listen")}</span>
          </button>
        )}
      </div>
    </div>
  );
};
