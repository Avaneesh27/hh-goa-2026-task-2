"use client";

import React from "react";
import { Mic, Square, Loader2, AlertCircle, Sparkles, Volume2, RotateCcw } from "lucide-react";
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
  const { t, currentLocale } = useTranslation();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-xl mx-auto">
      {/* Primary Voice Interaction Stage */}
      <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 w-full rounded-3xl glass-panel relative overflow-hidden transition-all duration-500">
        {/* Ambient radial lighting glow behind button */}
        <div
          className={`absolute w-72 h-72 rounded-full blur-[100px] -z-10 pointer-events-none transition-all duration-700 ${
            isRecording
              ? "bg-rose-500/25 scale-125 opacity-100"
              : isLoading
              ? "bg-brand-500/25 scale-110 opacity-100 animate-pulse"
              : error
              ? "bg-amber-500/20 scale-100 opacity-80"
              : "bg-gradient-to-tr from-brand-600/15 to-indigo-500/15 scale-95 opacity-75"
          }`}
        />

        {/* Top Status Header */}
        <div className="flex items-center justify-between w-full max-w-md mb-6 px-2">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                isRecording
                  ? "bg-rose-500 animate-ping"
                  : isLoading
                  ? "bg-amber-400 animate-pulse"
                  : error
                  ? "bg-amber-500"
                  : "bg-emerald-400"
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {isRecording
                ? t("voice.listening")
                : isLoading
                ? loadingStage || t("voice.processing")
                : t("voice.ready")}
            </span>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full glass-pill text-brand-300 border border-brand-500/20">
            {t("voice.micBadge")}: {currentLocale.nativeName}
          </span>
        </div>

        {/* Center Dominant Microphone Orb */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Animated sound ripple rings during recording */}
          {isRecording && (
            <>
              <div
                className="absolute inset-0 rounded-full bg-rose-500/20 animate-recording-ripple pointer-events-none"
                style={{
                  transform: `scale(${1.1 + (audioLevel / 100) * 0.5})`,
                }}
              />
              <div
                className="absolute -inset-3 rounded-full border border-rose-500/30 animate-pulse pointer-events-none"
                style={{
                  transform: `scale(${1 + (audioLevel / 100) * 0.25})`,
                }}
              />
            </>
          )}

          {/* Idle ambient breathing ring */}
          {!isRecording && !isLoading && (
            <div className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-brand-500/20 to-indigo-500/20 blur-sm pointer-events-none" />
          )}

          {/* Main Action Circular Button */}
          <button
            type="button"
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isLoading}
            className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-1.5 shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer focus:outline-none focus:ring-4 ${
              isRecording
                ? "bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/40 ring-rose-400/40"
                : isLoading
                ? "bg-slate-900/90 border border-slate-700 text-brand-400 cursor-not-allowed ring-brand-500/20"
                : "bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white hover:scale-105 hover:shadow-brand-500/40 ring-white/10"
            }`}
            aria-label={isRecording ? t("voice.stop") : t("voice.speak")}
          >
            {isRecording ? (
              <>
                <Square className="w-9 h-9 fill-current transition-transform duration-200" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-100">
                  {t("voice.stop")}
                </span>
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  RAG...
                </span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10 text-white transition-transform duration-200 group-hover:scale-110" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/90">
                  {t("voice.speak")}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Live Audio Visualizer / Timer or Idle Prompt */}
        <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-sm">
          {isRecording ? (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 w-full justify-between">
                <span className="text-xs font-mono font-bold text-rose-400 min-w-[45px]">
                  {formatTime(recordingTime)}
                </span>
                {/* Audio visualizer spectrum bars */}
                <div className="flex items-center gap-1.5 flex-1 h-7 justify-center px-2">
                  {[...Array(16)].map((_, i) => {
                    const dynamicHeight = Math.max(
                      4,
                      Math.min(28, audioLevel * (0.25 + (i % 7) * 0.12) + 4)
                    );
                    return (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-rose-600 via-rose-400 to-red-300 transition-all duration-75"
                        style={{ height: `${dynamicHeight}px` }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-mono text-slate-500">00:30</span>
              </div>

              {/* Live Speech Recognition Feedback Stream */}
              {liveTranscript ? (
                <div className="p-3 rounded-2xl bg-[#030712]/90 border border-brand-500/30 text-center shadow-lg">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-400 mb-0.5">
                    {t("voice.liveStream")}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium italic">
                    "{liveTranscript}"
                  </p>
                </div>
              ) : (
                <p className="text-xs text-rose-300/90 font-medium animate-pulse">
                  {t("voice.speakNow")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xs">
              {t("voice.tapToSpeak")}
            </p>
          )}
        </div>

        {/* Error Alert Box with Retry */}
        {error && (
          <div className="mt-5 p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-200 w-full max-w-md backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {onClearError && (
              <button
                onClick={onClearError}
                className="p-1 rounded-lg hover:bg-amber-900/40 text-amber-300 transition-colors"
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
