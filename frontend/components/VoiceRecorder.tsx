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
  const { t, currentLanguage } = useTranslation();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-xl mx-auto">
      {/* Primary Voice Interaction Stage */}
      <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 w-full rounded-3xl glass-panel relative overflow-hidden transition-all duration-500">
        {/* High-Luminance Ambient Radial Lighting Glow behind button */}
        <div
          className={`absolute w-80 h-80 rounded-full pointer-events-none transition-all duration-700 ${
            isRecording
              ? "bg-gradient-to-tr from-rose-500/60 via-red-500/50 to-pink-500/50 blur-[100px] scale-135 opacity-100 animate-pulse"
              : isLoading
              ? "bg-gradient-to-tr from-cyan-400/50 via-brand-500/45 to-purple-500/45 blur-[100px] scale-125 opacity-100 animate-pulse"
              : error
              ? "bg-amber-500/35 blur-[90px] scale-110 opacity-90"
              : "bg-gradient-to-tr from-brand-500/40 via-purple-500/35 to-indigo-500/35 blur-[90px] scale-110 opacity-90"
          }`}
        />

        {/* Top Status Header */}
        <div className="flex items-center justify-between w-full max-w-md mb-6 px-2">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                isRecording
                  ? "bg-rose-500 animate-ping shadow-[0_0_10px_rgba(244,63,94,0.9)]"
                  : isLoading
                  ? "bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.9)]"
                  : error
                  ? "bg-amber-500"
                  : "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {isRecording
                ? t("voice.listening")
                : isLoading
                ? loadingStage || t("voice.processing")
                : t("voice.ready")}
            </span>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full glass-pill text-brand-300 border border-brand-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            {t("voice.micBadge")}: {currentLanguage.nativeName}
          </span>
        </div>

        {/* Center Dominant Microphone Orb */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Multi-Layer Animated Sound Ripple Rings during recording */}
          {isRecording && (
            <>
              <div
                className="absolute inset-0 rounded-full bg-rose-500/30 animate-recording-ripple pointer-events-none ring-2 ring-rose-400/80"
                style={{
                  transform: `scale(${1.15 + (audioLevel / 100) * 0.6})`,
                }}
              />
              <div
                className="absolute inset-0 rounded-full bg-pink-500/20 animate-recording-ripple-secondary pointer-events-none ring-1 ring-pink-300/60"
                style={{
                  transform: `scale(${1.25 + (audioLevel / 100) * 0.7})`,
                }}
              />
              <div
                className="absolute -inset-4 rounded-full border-2 border-rose-400/60 animate-pulse pointer-events-none shadow-[0_0_30px_rgba(244,63,94,0.6)]"
                style={{
                  transform: `scale(${1 + (audioLevel / 100) * 0.35})`,
                }}
              />
            </>
          )}

          {/* Idle Luminous Ambient Ring */}
          {!isRecording && !isLoading && (
            <div className="absolute -inset-3.5 rounded-full bg-gradient-to-r from-brand-500/40 via-purple-500/30 to-indigo-500/40 blur-md pointer-events-none animate-pulse-glow" />
          )}

          {/* Main Action Circular Button */}
          <button
            type="button"
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isLoading}
            className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-1.5 shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer focus:outline-none focus:ring-4 ${
              isRecording
                ? "bg-gradient-to-tr from-rose-600 via-red-500 to-pink-500 text-white shadow-[0_0_40px_rgba(244,63,94,0.6)] ring-4 ring-rose-400/50"
                : isLoading
                ? "bg-slate-900/90 border border-brand-500/50 text-brand-400 cursor-not-allowed ring-4 ring-brand-500/30 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                : "bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white hover:scale-105 hover:shadow-[0_0_45px_rgba(168,85,247,0.6)] ring-4 ring-brand-400/30"
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
                <Loader2 className="w-10 h-10 animate-spin text-brand-300" />
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                  RAG...
                </span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10 text-white transition-transform duration-200 group-hover:scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-white drop-shadow">
                  {t("voice.speak")}
                </span>
              </>
            )}
          </button>
        </div>

        {/* High-Frequency Spectrum Visualizer & Timer */}
        <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-sm">
          {isRecording ? (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 w-full justify-between">
                <span className="text-xs font-mono font-bold text-rose-400 min-w-[45px] drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  {formatTime(recordingTime)}
                </span>
                {/* Luminous Audio Visualizer Spectrum Bars */}
                <div className="flex items-center gap-1.5 flex-1 h-8 justify-center px-2">
                  {[...Array(18)].map((_, i) => {
                    const dynamicHeight = Math.max(
                      5,
                      Math.min(32, audioLevel * (0.28 + (i % 7) * 0.14) + 5)
                    );
                    return (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-rose-500 via-pink-400 to-amber-300 transition-all duration-75 shadow-[0_0_10px_rgba(244,63,94,0.7)]"
                        style={{ height: `${dynamicHeight}px` }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-mono text-slate-400">00:30</span>
              </div>

              {/* Live Speech Recognition Stream */}
              {liveTranscript ? (
                <div className="p-3 rounded-2xl bg-[#030712]/95 border border-brand-500/40 text-center shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-300 mb-0.5">
                    {t("voice.liveStream")}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium italic">
                    "{liveTranscript}"
                  </p>
                </div>
              ) : (
                <p className="text-xs text-rose-300 font-semibold animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]">
                  {t("voice.speakNow")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xs leading-relaxed">
              {t("voice.tapToSpeak")}
            </p>
          )}
        </div>

        {/* Error Alert Box with Retry */}
        {error && (
          <div className="mt-5 p-3.5 bg-amber-950/50 border border-amber-500/50 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-200 w-full max-w-md backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.2)]">
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
