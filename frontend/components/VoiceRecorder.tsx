import React from "react";
import { Mic, MicOff, Square, Loader2, AlertCircle, Sparkles } from "lucide-react";

interface VoiceRecorderProps {
  isRecording: boolean;
  recordingTime: number;
  audioLevel: number;
  isLoading: boolean;
  loadingStage: string;
  languageName?: string;
  liveTranscript?: string;
  error: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  recordingTime,
  audioLevel,
  isLoading,
  loadingStage,
  languageName = "Auto",
  liveTranscript = "",
  error,
  onStartRecording,
  onStopRecording,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className={`absolute w-64 h-64 rounded-full blur-3xl -z-10 transition-all duration-700 pointer-events-none ${
          isRecording
            ? "bg-rose-500/20 scale-125"
            : isLoading
            ? "bg-brand-500/20 scale-110"
            : "bg-indigo-500/10 scale-90"
        }`}
      />

      {/* Recording Status Header */}
      <div className="flex items-center justify-between w-full max-w-sm mb-6">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              isRecording
                ? "bg-rose-500 animate-ping"
                : isLoading
                ? "bg-amber-400 animate-pulse"
                : "bg-emerald-400"
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isRecording
              ? "Listening..."
              : isLoading
              ? loadingStage || "Processing..."
              : "Voice Input Ready"}
          </span>
        </div>

        {/* Active listening language badge */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-brand-300">
          Mic: {languageName}
        </span>
      </div>

      {/* Center Action Button */}
      <div className="relative my-2 flex items-center justify-center">
        {/* Animated Sound Wave Ripple during recording */}
        {isRecording && (
          <div
            className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping"
            style={{
              transform: `scale(${1 + audioLevel / 70})`,
              transition: "transform 0.1s ease-out",
            }}
          />
        )}

        <button
          type="button"
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isLoading}
          className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center gap-1 shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
            isRecording
              ? "bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/40 ring-4 ring-rose-400/30"
              : isLoading
              ? "bg-slate-800 text-slate-400 cursor-not-allowed ring-2 ring-slate-700"
              : "bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 text-white hover:shadow-brand-500/40 hover:scale-105 ring-4 ring-brand-500/20"
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-8 h-8 fill-current" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Stop</span>
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
              <span className="text-[10px] font-medium text-slate-400">RAG...</span>
            </>
          ) : (
            <>
              <Mic className="w-8 h-8" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Speak</span>
            </>
          )}
        </button>
      </div>

      {/* Timer & Live Audio Decibel Bars */}
      <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-sm">
        {isRecording ? (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-3 w-full justify-between">
              <span className="text-xs font-mono font-semibold text-rose-400 min-w-[45px]">
                {formatTime(recordingTime)}
              </span>
              {/* Live Audio Visualizer Bars */}
              <div className="flex items-center gap-1.5 flex-1 h-6 justify-center">
                {[...Array(14)].map((_, i) => {
                  const height = Math.max(
                    4,
                    Math.min(26, (audioLevel * (0.3 + (i % 6) * 0.15)) + 4)
                  );
                  return (
                    <span
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-rose-600 to-rose-400 transition-all duration-75"
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>
              <span className="text-xs font-mono text-slate-500">00:30</span>
            </div>

            {/* Live speech preview if speech detected */}
            {liveTranscript ? (
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <p className="text-xs text-brand-300 font-medium italic">
                  "{liveTranscript}"
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-center text-rose-300 font-medium animate-pulse">
                🔴 Listening... Speak clearly into your mic, then click "Stop"
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center font-medium">
            Tap mic to speak in Hindi, English, or any of 14 Indian languages
          </p>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mt-4 p-3 bg-red-950/50 border border-red-800/80 rounded-xl flex items-start gap-2 text-xs text-red-200 w-full max-w-md">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

