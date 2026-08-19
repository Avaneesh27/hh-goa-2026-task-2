"use client";

import React from "react";
import { Mic, Square, Loader2, AlertCircle, RotateCcw, Volume2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface VoiceRecorderProps {
  isRecording: boolean;
  recordingTime: number;
  audioLevel: number;
  isLoading: boolean;
  loadingStage?: string;
  liveTranscript?: string;
  error: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearError?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  recordingTime,
  audioLevel,
  isLoading,
  loadingStage,
  liveTranscript = "",
  error,
  onStartRecording,
  onStopRecording,
  onClearError,
}) => {
  const { t, currentLanguage } = useTranslation();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-xl mx-auto">
      {/* Primary Voice Interaction Card */}
      <div className="relative flex flex-col items-center justify-center p-7 sm:p-9 w-full rounded-3xl paper-card bg-[#FFFFFF] border-[#EBE5D8] overflow-hidden transition-all duration-300">
        {/* Top Status Header */}
        <div className="flex items-center justify-between w-full mb-6 px-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                isRecording
                  ? "bg-[#E85D42] animate-ping"
                  : isLoading
                  ? "bg-[#D97706] animate-pulse"
                  : error
                  ? "bg-[#D97706]"
                  : "bg-[#16A34A]"
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC]">
              {isRecording
                ? t("voice.listening")
                : isLoading
                ? loadingStage || t("voice.processing")
                : t("voice.ready")}
            </span>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FAF8F3] dark:bg-[#0B0F19] text-[#5A6478] dark:text-[#94A3B8] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm">
            {t("voice.micBadge")}: <span className="text-[#E85D42] font-semibold">{currentLanguage.nativeName}</span>
          </span>
        </div>

        {/* Center Dominant Tactile Microphone Button */}
        <div className="relative my-3 flex items-center justify-center">
          {/* Multi-Layer Animated Sound Ripple Rings during recording */}
          {isRecording && (
            <>
              <div
                className="absolute inset-0 rounded-full bg-[#FEE2E2]/60 animate-ripple-warm pointer-events-none"
                style={{
                  transform: `scale(${1.15 + (audioLevel / 100) * 0.5})`,
                }}
              />
              <div
                className="absolute -inset-3 rounded-full border-2 border-[#E85D42]/40 animate-pulse pointer-events-none"
                style={{
                  transform: `scale(${1 + (audioLevel / 100) * 0.3})`,
                }}
              />
            </>
          )}

          {/* Idle Soft Ambient Ring */}
          {!isRecording && !isLoading && (
            <div className="absolute -inset-2.5 rounded-full bg-[#FFEDE8]/80 pointer-events-none transition-all duration-300 group-hover:scale-105" />
          )}

          {/* Main Action Circular Button with Physical Tactile Shadow */}
          <button
            type="button"
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isLoading}
            className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer focus:outline-none ${
              isRecording
                ? "bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-white shadow-[0_6px_0_0_#991B1B,0_12px_24px_rgba(220,38,38,0.3)] active:translate-y-1 active:shadow-[0_2px_0_0_#991B1B]"
                : isLoading
                ? "bg-[#FAF8F3] border-2 border-[#EBE5D8] text-[#D97706] cursor-not-allowed shadow-inner"
                : "bg-gradient-to-b from-[#F06A50] to-[#E85D42] text-white shadow-[0_6px_0_0_#B03019,0_12px_24px_rgba(232,93,66,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#B03019,0_16px_28px_rgba(232,93,66,0.35)] active:translate-y-1 active:shadow-[0_2px_0_0_#B03019]"
            }`}
            aria-label={isRecording ? t("voice.stop") : t("voice.speak")}
          >
            {isRecording ? (
              <>
                <Square className="w-8 h-8 fill-current" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">
                  {t("voice.stop")}
                </span>
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="w-9 h-9 animate-spin text-[#E85D42]" />
                <span className="text-[10px] font-bold text-[#5A6478] uppercase tracking-wider">
                  RAG...
                </span>
              </>
            ) : (
              <>
                <Mic className="w-9 h-9 text-white drop-shadow-sm" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white drop-shadow-sm">
                  {t("voice.speak")}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Audio Spectrum Visualizer & Timer */}
        <div className="mt-5 flex flex-col items-center gap-2.5 w-full max-w-sm">
          {isRecording ? (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 w-full justify-between">
                <span className="text-xs font-mono font-bold text-[#E85D42] min-w-[45px]">
                  {formatTime(recordingTime)}
                </span>
                {/* Audio Visualizer Spectrum Bars */}
                <div className="flex items-center gap-1.5 flex-1 h-8 justify-center px-2">
                  {[...Array(16)].map((_, i) => {
                    const dynamicHeight = Math.max(
                      6,
                      Math.min(30, audioLevel * (0.3 + (i % 5) * 0.15) + 6)
                    );
                    return (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-[#E85D42] transition-all duration-75"
                        style={{ height: `${dynamicHeight}px` }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-mono text-[#8B95A5]">00:30</span>
              </div>

              {/* Live Speech Recognition Stream */}
              {liveTranscript ? (
                <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#EBE5D8] text-center shadow-inner">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#E85D42] mb-0.5">
                    {t("voice.liveStream")}
                  </span>
                  <p className="text-xs sm:text-sm text-[#172033] font-medium italic">
                    "{liveTranscript}"
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#E85D42] font-semibold animate-pulse">
                  {t("voice.speakNow")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#5A6478] font-medium max-w-xs leading-relaxed">
              {t("voice.tapToSpeak")}
            </p>
          )}
        </div>

        {/* Error Alert Box with Dismiss */}
        {error && (
          <div className="mt-4 p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl flex items-center justify-between gap-3 text-xs text-[#92400E] w-full max-w-md shadow-warm-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {onClearError && (
              <button
                onClick={onClearError}
                className="p-1 rounded-lg hover:bg-[#FEF3C7] text-[#92400E] transition-colors"
                title="Dismiss"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
