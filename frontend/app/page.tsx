"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Send,
  Volume2,
  Sliders,
  RotateCcw,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Zap,
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
import { PipelineStory } from "@/components/PipelineStory";
import { Footer } from "@/components/Footer";

const SAMPLE_QUERIES = [
  { text: "कॉर्पोरेशन क्या है?", lang: "hi", label: "हिन्दी", tagColor: "bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 text-[#D14328] dark:text-[#F8876B] border-[#FFD7CD] dark:border-[#FFD7CD]/20" },
  { text: "What is a corporation?", lang: "en", label: "English", tagColor: "bg-[#EFF6FF] dark:bg-[#EFF6FF]/10 text-[#1D4ED8] dark:text-[#60A5FA] border-[#BFDBFE] dark:border-[#BFDBFE]/20" },
  { text: "কর্পোরেশন কি?", lang: "bn", label: "বাংলা", tagColor: "bg-[#F0FDF4] dark:bg-[#F0FDF4]/10 text-[#15803D] dark:text-[#4ADE80] border-[#BBF7D0] dark:border-[#BBF7D0]/20" },
  { text: "कॉर्पोरेशन म्हणजे काय?", lang: "mr", label: "मराठी", tagColor: "bg-[#FEF3C7] dark:bg-[#FEF3C7]/10 text-[#B45309] dark:text-[#FBBF24] border-[#FDE68A] dark:border-[#FDE68A]/20" },
  { text: "கார்ப்பரேஷன் என்றால் என்ன?", lang: "ta", label: "தமிழ்", tagColor: "bg-[#FDF2F8] dark:bg-[#FDF2F8]/10 text-[#BE185D] dark:text-[#F472B6] border-[#FBCFE8] dark:border-[#FBCFE8]/20" },
  { text: "కార్పొరేషన్ అంటే ఏమిటి?", lang: "te", label: "తెలుగు", tagColor: "bg-[#F5F3FF] dark:bg-[#F5F3FF]/10 text-[#6D28D9] dark:text-[#A78BFA] border-[#DDD6FE] dark:border-[#DDD6FE]/20" },
  { text: "کارپوریشن کیا ہے؟", lang: "ur", label: "اردو", tagColor: "bg-[#F0FDFA] dark:bg-[#F0FDFA]/10 text-[#0F766E] dark:text-[#2DD4BF] border-[#99F6E4] dark:border-[#99F6E4]/20" },
  { text: "Who won the 2026 Mars Olympics marathon?", lang: "en", label: "Abstain Test", tagColor: "bg-[#FEF2F2] dark:bg-[#FEF2F2]/10 text-[#B91C1C] dark:text-[#F87171] border-[#FECACA] dark:border-[#FECACA]/20" },
];

const MULTILINGUAL_MARQUEE = [
  { name: "हिन्दी", script: "Hindi", tag: "hi" },
  { name: "English", script: "Latin", tag: "en" },
  { name: "বাংলা", script: "Bengali", tag: "bn" },
  { name: "मराठी", script: "Marathi", tag: "mr" },
  { name: "தமிழ்", script: "Tamil", tag: "ta" },
  { name: "తెలుగు", script: "Telugu", tag: "te" },
  { name: "ಕನ್ನಡ", script: "Kannada", tag: "kn" },
  { name: "മലയാളം", script: "Malayalam", tag: "ml" },
  { name: "ગુજરાતી", script: "Gujarati", tag: "gu" },
  { name: "ਪੰਜਾਬੀ", script: "Punjabi", tag: "pa" },
  { name: "অসমীয়া", script: "Assamese", tag: "as" },
  { name: "ଓଡ଼ିଆ", script: "Odia", tag: "or" },
  { name: "नेपाली", script: "Nepali", tag: "ne" },
  { name: "संस्कृतम्", script: "Sanskrit", tag: "sa" },
  { name: "اردو", script: "Urdu", tag: "ur" },
];

export default function HomePage() {
  const { 
    t, 
    interactionLanguage, 
    setInteractionLanguage, 
    currentInteractionLanguage 
  } = useTranslation();

  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Direct DOM Ref for GPU ScaleX Scroll Progress Line
  const progressBarRef = useRef<HTMLDivElement>(null);

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

  // Voice recording hook with language passed from interactionLanguage
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
  } = useAudioRecorder(30, interactionLanguage);

  // GPU ScaleX Scroll Progress Listener
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = totalHeight > 0 ? Math.min(Math.max(currentScroll / totalHeight, 0), 1) : 0;

          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${progress})`;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        result = await sendVoiceQuery(blob, interactionLanguage, spokenText);
      } catch (err: any) {
        if (spokenText) {
          result = await sendTextQuery(spokenText, interactionLanguage);
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
        result = await sendTextQuery(spokenText, interactionLanguage);
      }

      setResponse(result);

      // Trigger automatic audio narration instantly with zero extra roundtrip
      narrateAnswer(
        result.answer,
        result.language || interactionLanguage || "en",
        result.audio_base64
      );
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
      const result = await sendTextQuery(query, interactionLanguage);
      setResponse(result);

      // Trigger automatic audio narration instantly with zero extra roundtrip
      narrateAnswer(
        result.answer,
        result.language || interactionLanguage || "en",
        result.audio_base64
      );
    } catch (err: any) {
      setApiError(err.message || "Failed to process query.");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  // Handle Try example chip click (Sets query and interaction language ONLY; NEVER changes pageLanguage)
  const handleExampleClick = (sample: { text: string; lang?: string }) => {
    setTextInput(sample.text);
    if (sample.lang) {
      setInteractionLanguage(sample.lang);
    }
  };

  // Reset all state for a fresh start
  const handleReset = () => {
    setTextInput("");
    setResponse(null);
    setApiError(null);
    setLoadingStage("");
    setIsLoading(false);
    if (isRecording) {
      stopRecording();
    }
    clearAudio();
    stopTTS();
  };

  // Compute ambient application state
  const appState: "idle" | "listening" | "processing" | "ready" = isRecording
    ? "listening"
    : isLoading
    ? "processing"
    : response
    ? "ready"
    : "idle";

  return (
    <div className={`min-h-screen flex flex-col justify-between relative ${reducedMotion ? "reduced-motion" : ""}`}>
      {/* 1. Ultra-Smooth GPU ScaleX Top Scroll Progress Line */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-[#F06A50] via-[#E85D42] to-[#D97706] z-50 pointer-events-none origin-left"
        style={{
          transform: "scaleX(0)",
          transformOrigin: "left center",
          willChange: "transform",
        }}
      />

      {/* 2. Organic Living Background with Mouse Parallax & Night Atmosphere */}
      <SpotlightBackground reducedMotion={reducedMotion} appState={appState} />

      {/* 3. Top Navigation Bar with Sun/Moon Theme Toggle */}
      <Navbar
        health={health}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        disabled={isLoading || isRecording}
      />

      {/* 4. Horizontal Multilingual Marquee Ribbon */}
      <div className="w-full bg-[#FFFFFF]/70 dark:bg-[#161F30]/70 border-b border-[#EBE5D8] dark:border-[#232E42] py-2 overflow-hidden relative z-10 transition-colors duration-300">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap text-xs font-semibold text-[#5A6478] dark:text-[#94A3B8]">
          {[...MULTILINGUAL_MARQUEE, ...MULTILINGUAL_MARQUEE].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setInteractionLanguage(item.tag)}
              className="inline-flex items-center gap-1.5 hover:text-[#E85D42] dark:hover:text-[#F06A50] transition-colors cursor-pointer"
            >
              <span className="font-bold text-[#172033] dark:text-[#F8FAFC]">{item.name}</span>
              <span className="text-[10px] text-[#8B95A5] dark:text-[#64748B] uppercase font-mono font-normal">
                ({item.script})
              </span>
              <span className="text-[#DDD5C4] dark:text-[#334155] mx-2">•</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Main Content Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-start gap-8 sm:gap-10 z-10">
        {/* Editorial Product Context Hero Section */}
        <div className="text-center max-w-3xl w-full mx-auto space-y-4 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-xs font-medium text-[#5A6478] dark:text-[#94A3B8] shadow-sm mb-1">
            <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">AI4Bharat MSMARCO-XI</span>
            <span className="text-[#8B95A5] dark:text-[#64748B]">•</span>
            <span className="font-mono text-[#E85D42] dark:text-[#F06A50] font-semibold">14 Indic Languages + English</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#172033] dark:text-[#F8FAFC] tracking-tight leading-tight sm:leading-tight max-w-2xl mx-auto px-2">
            {t("app.hero.title")}{" "}
            <span className="text-[#E85D42] dark:text-[#F06A50] underline decoration-[#FED7AA] dark:decoration-[#E85D42]/40 underline-offset-4 decoration-2">
              {t("app.hero.highlight")}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#5A6478] dark:text-[#94A3B8] max-w-xl mx-auto font-normal leading-relaxed pt-1">
            {t("app.hero.description")}
          </p>

          {/* Multilingual Question Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3 pb-1 relative z-10">
            <span className="text-xs text-[#5A6478] dark:text-[#94A3B8] font-bold mr-1">
              {t("app.try.label")}
            </span>
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(sample)}
                disabled={isLoading || isRecording}
                className="px-2.5 py-1 rounded-lg text-xs bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm hover:border-[#E85D42] dark:hover:border-[#F06A50] text-[#172033] dark:text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sample.tagColor}`}>
                  {sample.label}
                </span>
                <span className="truncate max-w-[180px] font-medium">"{sample.text}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Centered Voice & Text Interaction Stage */}
        <div className="w-full flex flex-col items-center justify-center gap-5 relative z-10">
          {/* Centered Tactile Microphone Control */}
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
            onReset={handleReset}
            onClearError={() => setApiError(null)}
          />

          {/* Tactile Search Input Bar */}
          <form
            onSubmit={handleTextSubmit}
            className="w-full max-w-xl p-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm flex items-center gap-2 transition-colors focus-within:border-[#E85D42] dark:focus-within:border-[#F06A50]"
          >
            <div className="pl-3 text-[#5A6478] dark:text-[#94A3B8]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t("search.placeholder")}
              disabled={isLoading || isRecording}
              className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-[#172033] dark:text-[#F8FAFC] placeholder-[#8B95A5] dark:placeholder-[#64748B] focus:outline-none font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || isRecording || !textInput.trim()}
              className="btn-coral px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t("search.button")}
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("search.button")}</span>
            </button>
          </form>
        </div>

        {/* Animated Processing State Journey */}
        {isLoading && (
          <div className="w-full max-w-md p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-warm-md flex items-center justify-between text-xs font-medium text-[#5A6478] dark:text-[#94A3B8] animate-pulse-warm">
            <span className="font-bold text-[#E85D42] dark:text-[#F06A50]">
              {loadingStage || "Processing..."}
            </span>
            <span className="font-mono text-[11px] text-[#5A6478] dark:text-[#94A3B8]">RAG Journey • Active</span>
          </div>
        )}

        {/* Results Stage Section */}
        {response ? (
          <div className="w-full max-w-3xl space-y-6 animate-fadeIn transition-all">
            {/* 1. Conversational Transcript Card ("You Said") */}
            <TranscriptCard
              transcript={response.transcript}
              language={response.language}
            />

            {/* 2. Editorial Answer Card with Integrated Audio Player */}
            <AnswerCard
              response={response}
              ttsStatus={ttsStatus}
              onPlayTTS={() => playTTS(response.answer, response.language)}
              onPauseTTS={pauseTTS}
              onResumeTTS={resumeTTS}
              onReplayTTS={replayTTS}
              onStopTTS={stopTTS}
              isSupported={isTTSSupported}
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
          /* Empty Warm Product Landing State */
          <div className="w-full max-w-xl p-8 sm:p-10 rounded-3xl bg-[#FFFFFF] dark:bg-[#161F30] border border-dashed border-[#EBE5D8] dark:border-[#232E42] text-center flex flex-col items-center justify-center gap-3 shadow-warm-sm transition-colors duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 flex items-center justify-center text-[#E85D42] dark:text-[#F8876B]">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172033] dark:text-[#F8FAFC]">
                {t("answer.awaitingInput")}
              </h2>
              <p className="text-xs text-[#5A6478] dark:text-[#94A3B8] max-w-xs mx-auto pt-0.5">
                {t("answer.awaitingDescription")}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 6. Interactive Sticky RAG Pipeline Storytelling Section (Sections 43, 44, 45) */}
      <PipelineStory />

      {/* 7. Rich Interactive Footer */}
      <Footer
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      {/* 8. Modals */}
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
