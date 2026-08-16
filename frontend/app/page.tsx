"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  Send,
  Sparkles,
  Database,
  ShieldAlert,
  Zap,
  Activity,
  Layers,
  Search,
  BookOpen,
  Volume2,
  RefreshCw
} from "lucide-react";

import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { sendTextQuery, sendVoiceQuery, fetchHealth } from "@/lib/api";
import { RAGResponse, HealthInfo } from "@/types/rag";

import { LanguageSelector, SUPPORTED_LANGUAGES } from "@/components/LanguageSelector";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { AnswerCard } from "@/components/AnswerCard";
import { ExecutionTrace } from "@/components/ExecutionTrace";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { LatencyMetrics } from "@/components/LatencyMetrics";

const SAMPLE_QUERIES = [
  { text: "कॉर्पोरेशन क्या है?", label: "Hindi (Def)" },
  { text: "what is a corporation?", label: "English" },
  { text: "Rachel Carson ne konsi book likhi thi?", label: "Hinglish" },
  { text: "Who won the 2026 Mars Olympics marathon?", label: "Unsupported (Abstain)" }
];

export default function HomePage() {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

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
    clearAudio
  } = useAudioRecorder(30, selectedLanguage);

  // Poll health on mount
  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.warn("Backend not yet connected:", err));
  }, []);

  // When audio recording finishes, automatically send to backend
  useEffect(() => {
    if (audioBlob && !isRecording) {
      handleVoiceSubmission(audioBlob, finalTranscript);
    }
  }, [audioBlob, isRecording]);

  const handleVoiceSubmission = async (blob: Blob, transcriptFallback?: string) => {
    setIsLoading(true);
    setLoadingStage("Processing Voice Query...");
    setApiError(null);

    const spokenText = (transcriptFallback || finalTranscript || liveTranscript || "").trim();

    try {
      setLoadingStage("Executing Hybrid RAG Pipeline...");
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

      // If backend was unable to transcribe audio but we captured the user's speech text in browser
      if (
        (result.transcript === "(audio unrecognizable)" || result.transcript === "कॉर्पोरेशन क्या है?") &&
        spokenText &&
        spokenText !== result.transcript
      ) {
        result = await sendTextQuery(spokenText, selectedLanguage);
      }

      setResponse(result);
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
    setLoadingStage("Executing Hybrid RAG Search...");
    setApiError(null);

    try {
      const result = await sendTextQuery(query, selectedLanguage);
      setResponse(result);
    } catch (err: any) {
      setApiError(err.message || "Failed to process query.");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Glow ambient background lights */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
                  HH Goa 2026
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Voice RAG
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Sarvam STT • AI4Bharat MSMARCO-XI • 14 Indic Languages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Health Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono text-[11px]">
                {health ? `${health.indexed_chunks.toLocaleString()} Chunks Indexed` : "Connecting..."}
              </span>
            </div>

            {/* Language Selector */}
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              disabled={isLoading || isRecording}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Hero & Quick Chips */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 mb-2">
            Ask Questions by <span className="gradient-text">Voice or Text</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-4">
            Supports Hindi, English, Hinglish, and all 14 Indian languages with sub-200ms hybrid retrieval and strict abstention.
          </p>

          {/* Quick Query Sample Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Try:</span>
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTextInput(sample.text);
                }}
                disabled={isLoading || isRecording}
                className="px-3 py-1 rounded-full text-xs bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/40 text-slate-300 transition-all active:scale-95"
              >
                <span className="font-semibold text-brand-400 mr-1.5">{sample.label}:</span>
                "{sample.text}"
              </button>
            ))}
          </div>
        </div>

        {/* Center Interaction Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Voice Recorder & Text Input */}
          <div className="lg:col-span-5 space-y-6">
            {/* Microphone Voice Recorder */}
            <VoiceRecorder
              isRecording={isRecording}
              recordingTime={recordingTime}
              audioLevel={audioLevel}
              isLoading={isLoading}
              loadingStage={loadingStage}
              languageName={SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || "Auto (Browser)"}
              error={recorderError || apiError}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />

            {/* Live Real-Time Speech Feedback Box */}
            {(isRecording || liveTranscript) && (
              <div className="p-3.5 bg-brand-950/40 border border-brand-500/40 rounded-2xl backdrop-blur-md shadow-lg transition-all animate-fadeIn">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300">
                    Live Microphone Stream
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-100 font-medium italic">
                  {liveTranscript ? `"${liveTranscript}"` : "Listening... speak now into your microphone"}
                </p>
              </div>
            )}

            {/* Text Input Alternate Bar */}
            <form
              onSubmit={handleTextSubmit}
              className="p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md flex items-center gap-2 shadow-lg"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type query in Hindi / English / Hinglish..."
                disabled={isLoading || isRecording}
                className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || isRecording || !textInput.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </form>

            {/* System Architecture Overview Card */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider">
                <Layers className="w-4 h-4 text-brand-400" />
                <span>Engine Pipeline</span>
              </div>
              <ul className="space-y-1.5 text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span><strong>STT:</strong> Sarvam Speech-to-Text (`saarika:v2`)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span><strong>Vector DB:</strong> Qdrant with Cosine HNSW ANN</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span><strong>Keyword Search:</strong> Multilingual Tokenized BM25</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span><strong>Fusion & Rerank:</strong> RRF ($k=60$) + Cross-Encoder</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Guardrails:</strong> Relevance, Grounding, Safety & Abstention</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Answer, Execution Trace, Evidence & Latency Metrics */}
          <div className="lg:col-span-7 space-y-6">
            {response ? (
              <>
                {/* 1. Answer Card */}
                <AnswerCard response={response} />

                {/* 2. Execution Trace */}
                <ExecutionTrace
                  trace={response.execution_trace}
                  totalLatencyMs={response.latency.end_to_end_ms}
                  abstained={response.abstained}
                />

                {/* 3. Latency Metrics */}
                <LatencyMetrics
                  latency={response.latency}
                  retrieval={response.retrieval}
                />

                {/* 4. Evidence Drawer */}
                <EvidenceDrawer evidence={response.evidence} />
              </>
            ) : (
              <div className="p-12 rounded-3xl border border-slate-800/80 bg-slate-900/30 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500">
                  <Volume2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-200">
                    Awaiting Voice or Text Input
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Press the microphone button or submit a text query to trigger the full RAG pipeline and view live metrics.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 bg-slate-950/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>HH Goa 2026 Shortlisting Task 2 — Voice-Enabled RAG System</span>
          <span>Indexed Dataset: AI4Bharat MSMARCO-XI</span>
        </div>
      </footer>
    </div>
  );
}
