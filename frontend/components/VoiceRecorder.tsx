"use client";

import React from "react";
import { Mic, Square, Loader2, AlertCircle, RotateCcw } from "lucide-react";
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
  onReset?: () => void;
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
  onReset,
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
      {/* Primary Voice Interaction Console */}
      <div className="relative flex flex-col items-center justify-center p-6 sm:p-8 w-full rounded-2xl paper-card bg-[#FFFFFF] dark:bg-[#161F30] border-[#EBE5D8] dark:border-[#232E42] overflow-hidden transition-colors">
        {/* Top Status Header */}
        <div className="flex items-center justify-between w-full mb-5 px-1">
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

          <div className="flex items-center gap-2">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F3] dark:bg-[#0B0F19] text-[#5A6478] dark:text-[#94A3B8] hover:text-[#E85D42] dark:hover:text-[#F06A50] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                title="Reset query"
                aria-label="Reset query"
              >
                <RotateCcw className="w-3 h-3 text-[#E85D42] dark:text-[#F06A50]" />
                <span>Reset</span>
              </button>
            )}

            <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-[#FAF8F3] dark:bg-[#0B0F19] text-[#5A6478] dark:text-[#94A3B8] border border-[#EBE5D8] dark:border-[#232E42]">
              {t("voice.micBadge")}: <span className="text-[#E85D42] dark:text-[#F06A50] font-semibold">{currentLanguage.nativeName}</span>
            </span>
          </div>
        </div>

        {/* Dominant Physical Tactile Microphone Button */}
        <div className="relative my-3 flex items-center justify-center">
          {/* Subtle concentric active ring during recording */}
          {isRecording && (
            <div
              className="absolute -inset-2.5 rounded-full border-2 border-[#E85D42]/30 pointer-events-none transition-transform duration-100"
              style={{
                transform: `scale(${1 + (audioLevel / 100) * 0.25})`,
              }}
            />
          )}

          {/* Main Action Circular Button */}
          <button
            type="button"
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isLoading}
            className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer focus:outline-none ${
              isRecording
                ? "bg-[#DC2626] border border-[#B91C1C] text-white shadow-[0_4px_0_0_#991B1B] active:translate-y-1 active:shadow-[0_0_0_0_#991B1B]"
                : isLoading
                ? "bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] text-[#D97706] cursor-not-allowed"
                : "bg-[#E85D42] hover:bg-[#DC5035] border border-[#D14328] text-white shadow-[0_4px_0_0_#B03019] active:translate-y-1 active:shadow-[0_0_0_0_#B03019]"
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
                <Loader2 className="w-8 h-8 animate-spin text-[#E85D42] dark:text-[#F06A50]" />
                <span className="text-[10px] font-bold text-[#5A6478] dark:text-[#94A3B8] uppercase tracking-wider">
                  RAG...
                </span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8 text-white" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">
                  {t("voice.speak")}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Audio Spectrum Visualizer & Timer */}
        <div className="mt-4 flex flex-col items-center gap-2.5 w-full max-w-sm">
          {isRecording ? (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 w-full justify-between">
                <span className="text-xs font-mono font-bold text-[#E85D42] dark:text-[#F06A50] min-w-[45px]">
                  {formatTime(recordingTime)}
                </span>
                {/* Audio Visualizer Spectrum Bars */}
                <div className="flex items-center gap-1 flex-1 h-7 justify-center px-2">
                  {[...Array(16)].map((_, i) => {
                    const dynamicHeight = Math.max(
                      4,
                      Math.min(26, audioLevel * (0.25 + (i % 5) * 0.12) + 4)
                    );
                    return (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-[#E85D42] dark:bg-[#F06A50] transition-all duration-75"
                        style={{ height: `${dynamicHeight}px` }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-mono text-[#8B95A5] dark:text-[#64748B]">00:30</span>
              </div>

              {/* Live Speech Recognition Stream */}
              {liveTranscript ? (
                <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#E85D42] dark:text-[#F06A50] mb-0.5">
                    {t("voice.liveStream")}
                  </span>
                  <p className="text-xs sm:text-sm text-[#172033] dark:text-[#F8FAFC] font-medium italic">
                    "{liveTranscript}"
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#E85D42] dark:text-[#F06A50] font-semibold">
                  {t("voice.speakNow")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#5A6478] dark:text-[#94A3B8] font-medium max-w-xs leading-relaxed">
              {t("voice.tapToSpeak")}
            </p>
          )}
        </div>

        {/* Error Alert Box with Dismiss */}
        {error && (
          <div className="mt-4 p-3 bg-[#FFFBEB] dark:bg-[#78350F]/20 border border-[#FDE68A] dark:border-[#FDE68A]/30 rounded-xl flex items-center justify-between gap-3 text-xs text-[#92400E] dark:text-[#FDE68A] w-full max-w-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {onClearError && (
              <button
                onClick={onClearError}
                className="p-1 rounded hover:bg-[#FEF3C7] dark:hover:bg-[#78350F]/40 text-[#92400E] dark:text-[#FDE68A] transition-colors"
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
