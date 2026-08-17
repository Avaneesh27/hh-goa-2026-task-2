"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  Volume2,
  Sliders,
  RotateCcw,
  Search,
  BookOpen
} from "lucide-react";

import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTTS } from "@/hooks/useTTS";
import { useTranslation } from "@/lib/i18n";
import { sendTextQuery, sendVoiceQuery, fetchHealth } from "@/lib/api";
import { RAGResponse, HealthInfo } from "@/types/rag";

import { SpotlightBackground } from "@/components/SpotlightBackground";
import { Navbar } from "@/components/Navbar";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { TranscriptCard } from "@/components/TranscriptCard";
import { AnswerCard } from "@/components/AnswerCard";
import { EvidenceList } from "@/components/EvidenceList";
import { LatencyMetrics } from "@/components/LatencyMetrics";
import { ExecutionTrace } from "@/components/ExecutionTrace";
import { SettingsModal } from "@/components/SettingsModal";
import { HowItWorksModal } from "@/components/HowItWorksModal";

const SAMPLE_QUERIES = [
  { text: "कॉर्पोरेशन क्या है?", lang: "hi", label: "हिन्दी" },
  { text: "What is a corporation?", lang: "en", label: "English" },
  { text: "কর্পোরেশন কি?", lang: "bn", label: "বাংলা" },
  { text: "कॉर्पोरेशन म्हणजे काय?", lang: "mr", label: "मराठी" },
  { text: "கார்ப்பரேஷன் என்றால் என்ன?", lang: "ta", label: "தமிழ்" },
  { text: "కార్పొరేషన్ అంటే ఏమిటి?", lang: "te", label: "తెలుగు" },
  { text: "کارپوریشن کیا ہے؟", lang: "ur", label: "اردو" },
  { text: "Who won the 2026 Mars Olympics marathon?", lang: "en", label: "Abstain" },
];

export default function HomePage() {
  const { t, selectedLanguage, setLanguage } = useTranslation();

  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Settings & Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(true);

  // TTS Hook for Voice Narration
  const {
    status: ttsStatus,
    autoPlayEnabled,
    setAutoPlayEnabled,
    play: playTTS,
    pause: pauseTTS,
    resume: resumeTTS,
    replay: replayTTS,
    stop: stopTTS,
    narrateAnswer,
    isSupported: isTTSSupported,
  } = useTTS();

  // Voice recording hook with language passed from single source of truth
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioLevel,
    liveTranscript,
    finalTranscript,
    error: recorderError,
    startRecording,
    stopRecording,
    clearAudio,
  } = useAudioRecorder(30, selectedLanguage);

  // Poll backend health on mount
  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.warn("Backend connection pending:", err));
  }, []);

  // When voice recording finishes, submit audio blob automatically
  useEffect(() => {
    if (audioBlob && !isRecording) {
      handleVoiceSubmission(audioBlob, finalTranscript);
    }
  }, [audioBlob, isRecording]);

  const handleVoiceSubmission = async (blob: Blob, transcriptFallback?: string) => {
    setIsLoading(true);
    setLoadingStage(t("voice.processing.stt"));
    setApiError(null);

    const spokenText = (transcriptFallback || finalTranscript || liveTranscript || "").trim();

    try {
      setLoadingStage(t("voice.processing.search"));
      let result: RAGResponse;
      try {
        result = await sendVoiceQuery(blob, selectedLanguage, spokenText);
      } catch (err: any) {
        if (spokenText) {
          result = await sendTextQuery(spokenText, selectedLanguage);
        } else {
          throw err;
        }
      }

      // If backend was unable to transcribe audio but we captured speech text in browser
      if (
        result.transcript === "(audio unrecognizable)" &&
        spokenText &&
        spokenText !== result.transcript
      ) {
        result = await sendTextQuery(spokenText, selectedLanguage);
      }

      setResponse(result);

      // Trigger automatic audio narration
      narrateAnswer(result.answer, result.language || selectedLanguage || "en");
    } catch (err: any) {
      setApiError(err.message || "Failed to process voice query.");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
      clearAudio();
    }
  };

  const handleTextSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || isLoading) return;

    const query = textInput.trim();
    setIsLoading(true);
    setLoadingStage(t("voice.processing.search"));
    setApiError(null);

    try {
      const result = await sendTextQuery(query, selectedLanguage);
      setResponse(result);

      // Trigger automatic audio narration
      narrateAnswer(result.answer, result.language || selectedLanguage || "en");
    } catch (err: any) {
      setApiError(err.message || "Failed to process query.");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between relative ${reducedMotion ? "reduced-motion" : ""}`}>
      {/* 1. Cursor Spotlight Follow Effect */}
      <SpotlightBackground reducedMotion={reducedMotion} />

      {/* 2. Top Navigation Bar */}
      <Navbar
        health={health}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        disabled={isLoading || isRecording}
      />

      {/* 3. Main Content Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-start gap-8 z-10">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {t("app.hero.title")}{" "}
            <span className="gradient-text">{t("app.hero.highlight")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-normal leading-relaxed">
            {t("app.hero.description")}
          </p>

          {/* Quick Query Sample Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-[11px] text-slate-500 font-semibold mr-1">
              {t("app.try.label")}
            </span>
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTextInput(sample.text);
                  if (sample.lang && sample.lang !== selectedLanguage) {
                    setLanguage(sample.lang);
                  }
                }}
                disabled={isLoading || isRecording}
                className="px-3 py-1 rounded-full text-xs glass-pill text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span className="text-brand-400 font-bold text-[10px]">
                  {sample.label}:
                </span>
                <span className="truncate max-w-[200px]">"{sample.text}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Centered Voice Interaction Section */}
        <div className="w-full flex flex-col items-center justify-center gap-5">
          {/* Centered Dominant Microphone Orb */}
          <VoiceRecorder
            isRecording={isRecording}
            recordingTime={recordingTime}
            audioLevel={audioLevel}
            isLoading={isLoading}
            loadingStage={loadingStage}
            liveTranscript={liveTranscript}
            error={recorderError || apiError}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onClearError={() => setApiError(null)}
          />

          {/* Glass Alternate Search Input Bar */}
          <form
            onSubmit={handleTextSubmit}
            className="w-full max-w-xl p-2 rounded-2xl glass-panel-subtle flex items-center gap-2 shadow-lg transition-all focus-within:border-brand-500/40"
          >
            <div className="pl-2.5 text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t("search.placeholder")}
              disabled={isLoading || isRecording}
              className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || isRecording || !textInput.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              aria-label={t("search.button")}
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("search.button")}</span>
            </button>
          </form>
        </div>

        {/* Results Stage Section */}
        {response ? (
          <div className="w-full max-w-3xl space-y-6 animate-fadeIn transition-all">
            {/* 1. Transcript Card */}
            <TranscriptCard
              transcript={response.transcript}
              language={response.language}
            />

            {/* 2. Prominent Answer Card with Integrated Audio Player */}
            <AnswerCard
              response={response}
              ttsStatus={ttsStatus}
              onPlayTTS={() => playTTS(response.answer, response.language)}
              onPauseTTS={pauseTTS}
              onResumeTTS={resumeTTS}
              onReplayTTS={replayTTS}
              onStopTTS={stopTTS}
              isTTSSupported={isTTSSupported}
            />

            {/* 3. Evidence Cards */}
            <EvidenceList evidence={response.evidence} />

            {/* 4. Telemetry Metrics & Pipeline Trace (if enabled in settings) */}
            {showTelemetry && (
              <div className="space-y-6">
                <LatencyMetrics
                  latency={response.latency}
                  retrieval={response.retrieval}
                />

                <ExecutionTrace
                  trace={response.execution_trace}
                  totalLatencyMs={response.latency.end_to_end_ms}
                  abstained={response.abstained}
                />
              </div>
            )}
          </div>
        ) : (
          /* Empty Product Landing State */
          <div className="w-full max-w-xl p-8 sm:p-10 rounded-3xl glass-panel-subtle text-center flex flex-col items-center justify-center gap-3 border-dashed border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                {t("answer.awaitingInput")}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                {t("answer.awaitingDescription")}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-white/5 py-4 bg-[#030712]/80 text-center text-xs text-slate-500 z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t("footer.task")}</span>
          <span>{t("footer.dataset")}</span>
        </div>
      </footer>

      {/* 5. Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        autoPlayEnabled={autoPlayEnabled}
        onToggleAutoPlay={setAutoPlayEnabled}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={setReducedMotion}
        showTelemetry={showTelemetry}
        onToggleTelemetry={setShowTelemetry}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </div>
  );
}
