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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#EBE5D8] text-xs text-[#8B95A5]">
        <VolumeX className="w-3.5 h-3.5" />
        <span>{t("tts.unsupported")}</span>
      </div>
    );
  }

  const isPlaying = status === "playing";
  const isPaused = status === "paused";
  const requiresGesture = status === "requiresGesture";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8F3] border border-[#EBE5D8] shadow-sm">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isPlaying
              ? "bg-[#E85D42] text-white shadow-warm-sm animate-pulse"
              : "bg-[#FFFFFF] border border-[#EBE5D8] text-[#E85D42]"
          }`}
        >
          <Volume2 className="w-4 h-4" />
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-bold text-[#172033]">
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
                  className="w-1 rounded-full bg-[#E85D42] animate-pulse"
                  style={{
                    height: `${6 + (i % 3) * 4}px`,
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
              className="px-3 py-1.5 rounded-xl paper-button text-xs font-bold text-[#172033] flex items-center gap-1"
              title={t("tts.pause")}
              aria-label={t("tts.pause")}
            >
              <Pause className="w-3.5 h-3.5" />
              <span>{t("tts.pause")}</span>
            </button>
            <button
              onClick={onStop}
              className="p-1.5 rounded-xl paper-button text-xs text-[#DC2626] hover:bg-[#FEE2E2]"
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
              className="px-3 py-1.5 rounded-xl bg-[#E85D42] hover:bg-[#D14328] text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              title={t("tts.resume")}
              aria-label={t("tts.resume")}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t("tts.resume")}</span>
            </button>
            <button
              onClick={onReplay}
              className="p-1.5 rounded-xl paper-button text-xs text-[#5A6478] hover:text-[#172033]"
              title={t("tts.replay")}
              aria-label={t("tts.replay")}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={onPlay}
            className="px-3.5 py-1.5 rounded-xl bg-[#E85D42] hover:bg-[#D14328] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
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
