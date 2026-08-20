"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  Activity,
  Layers,
  Search,
  ShieldCheck,
  Volume2,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface PipelineStep {
  id: string;
  number: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  details: string[];
  techPills: string[];
  icon: React.ReactNode;
  accentColor: string;
  tagColor: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "step-speak",
    number: "01",
    badge: "Input Stage",
    title: "Speak in Any Indian Language",
    subtitle: "Real-Time Audio Capture",
    description:
      "Your voice is captured through high-fidelity Web Audio API and MediaRecorder, computing real-time decibel amplitudes and audio level frequencies.",
    details: [
      "Dynamic decibel amplitude visualizer",
      "Native Web Speech fallback & local stream sync",
      "Sub-millisecond audio blob compilation",
    ],
    techPills: ["Web Audio API", "MediaRecorder", "14 Indic Scripts"],
    icon: <Mic className="w-5 h-5 text-[#E85D42]" />,
    accentColor: "#E85D42",
    tagColor: "bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 text-[#D14328] dark:text-[#F8876B] border-[#FFD7CD] dark:border-[#FFD7CD]/20",
  },
  {
    id: "step-transcribe",
    number: "02",
    badge: "Speech-To-Text",
    title: "Sarvam STT Transcription",
    subtitle: "Multilingual Speech Recognition",
    description:
      "Raw speech audio is ingested into Sarvam AI (saarika:v2), accurately transcribing Hindi, Hinglish, Bengali, Tamil, Telugu, and all 14 Indian languages.",
    details: [
      "Zero-shot Indic script recognition",
      "Automatic language detection & normalization",
      "Hinglish code-mixing translation resilience",
    ],
    techPills: ["Sarvam AI", "saarika:v2", "Query Normalization"],
    icon: <Activity className="w-5 h-5 text-[#3B82F6]" />,
    accentColor: "#3B82F6",
    tagColor: "bg-[#EFF6FF] dark:bg-[#EFF6FF]/10 text-[#1D4ED8] dark:text-[#60A5FA] border-[#BFDBFE] dark:border-[#BFDBFE]/20",
  },
  {
    id: "step-retrieve",
    number: "03",
    badge: "Hybrid Retrieval",
    title: "Dense Vector ANN + BM25 Search",
    subtitle: "Dual-Engine Passage Retrieval",
    description:
      "Query embeddings are mapped in 384-dimensional multilingual space in Qdrant while simultaneously querying an inverted BM25 index across 29,666 MSMARCO-XI chunks.",
    details: [
      "Qdrant Cosine Vector ANN search (<35ms)",
      "Rank-BM25 rare term and exact keyword match (<18ms)",
      "Combines semantic intent with precise keyword hits (+12% Recall@20)",
    ],
    techPills: ["Qdrant Vector DB", "Rank-BM25", "MSMARCO-XI Corpus"],
    icon: <Search className="w-5 h-5 text-[#0D9488]" />,
    accentColor: "#0D9488",
    tagColor: "bg-[#F0FDFA] dark:bg-[#F0FDFA]/10 text-[#0F766E] dark:text-[#2DD4BF] border-[#99F6E4] dark:border-[#99F6E4]/20",
  },
  {
    id: "step-rerank",
    number: "04",
    badge: "Ranking & Fusion",
    title: "RRF Fusion & Cross-Encoder Reranking",
    subtitle: "Top-20 Candidates → Top-5 Evidence",
    description:
      "Reciprocal Rank Fusion (RRF k=60) merges candidate rankings, followed by BAAI/bge-reranker-base cross-attention to score true passage relevance.",
    details: [
      "Reciprocal Rank Fusion eliminates search bias",
      "Cross-Encoder joint query-passage cross-attention",
      "High confidence thresholding for factual grounding",
    ],
    techPills: ["RRF (k=60)", "BAAI/bge-reranker", "Top-5 Passage Filter"],
    icon: <Layers className="w-5 h-5 text-[#D97706]" />,
    accentColor: "#D97706",
    tagColor: "bg-[#FEF3C7] dark:bg-[#FEF3C7]/10 text-[#B45309] dark:text-[#FBBF24] border-[#FDE68A] dark:border-[#FDE68A]/20",
  },
  {
    id: "step-ground",
    number: "05",
    badge: "Guardrail Engine",
    title: "4-Tier Deterministic Guardrails",
    subtitle: "Strict Abstention & Zero Hallucination",
    description:
      "Before an answer is synthesized, 4 deterministic guardrails verify claim alignment. If evidence is missing, the system explicitly abstains rather than hallucinating.",
    details: [
      "Tier 1: Safety & prompt injection check",
      "Tier 2: Relevance & RRF confidence thresholds",
      "Tier 3: Strict NLI-style passage grounding verification",
      "Tier 4: Multilingual polite abstention fallback",
    ],
    techPills: ["4-Tier Guardrails", "Strict Abstention", "Grounding Verifier"],
    icon: <ShieldCheck className="w-5 h-5 text-[#16A34A]" />,
    accentColor: "#16A34A",
    tagColor: "bg-[#F0FDF4] dark:bg-[#F0FDF4]/10 text-[#15803D] dark:text-[#4ADE80] border-[#BBF7D0] dark:border-[#BBF7D0]/20",
  },
  {
    id: "step-answer",
    number: "06",
    badge: "Delivery Stage",
    title: "Grounded Answer & Audio Narration",
    subtitle: "Editorial Result + Interactive Citations",
    description:
      "A clear, fully referenced answer is rendered with interactive [SOURCE 01] citations and natural audio narration in the query's native Indian language.",
    details: [
      "Sub-200ms end-to-end response delivery",
      "Interactive expandable passage citations",
      "Automatic multilingual audio voice playback",
    ],
    techPills: ["Grounded Synthesis", "Interactive Citations", "Voice Narration"],
    icon: <Volume2 className="w-5 h-5 text-[#E85D42]" />,
    accentColor: "#E85D42",
    tagColor: "bg-[#FFEDE8] dark:bg-[#FFEDE8]/10 text-[#D14328] dark:text-[#F8876B] border-[#FFD7CD] dark:border-[#FFD7CD]/20",
  },
];

export const PipelineStory: React.FC = () => {
  const { t } = useTranslation();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStepRef = useRef(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Ultra-Smooth C2-Continuous Scroll Interpolation Engine (GPU compositor optimized)
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      const handleSimpleScroll = () => {
        let closestIdx = 0;
        let minDistance = Infinity;
        const viewportCenter = window.innerHeight * 0.46;

        cardRefs.current.forEach((el, idx) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenter - viewportCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = idx;
          }
        });

        if (closestIdx !== activeStepRef.current) {
          activeStepRef.current = closestIdx;
          setActiveStepIndex(closestIdx);
        }
      };

      window.addEventListener("scroll", handleSimpleScroll, { passive: true });
      handleSimpleScroll();
      return () => window.removeEventListener("scroll", handleSimpleScroll);
    }

    let ticking = false;

    const updateCardTransforms = () => {
      const viewportHeight = window.innerHeight || 800;
      const targetFocusY = viewportHeight * 0.46; // Focal plane ~46% of viewport
      const focalZone = viewportHeight * 0.48; // Smooth blending radius

      let closestIdx = 0;
      let minDistance = Infinity;

      cardRefs.current.forEach((cardEl, idx) => {
        if (!cardEl) return;

        const rect = cardEl.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distFromCenter = cardCenter - targetFocusY;
        const absDist = Math.abs(distFromCenter);

        if (absDist < minDistance) {
          minDistance = absDist;
          closestIdx = idx;
        }

        // C2-Continuous Cosine Smoothstep interpolation:
        // When absDist == 0 (dead center), smoothFactor = 1.0
        // When absDist >= focalZone, smoothFactor = 0.0
        // Zero derivative at both endpoints for velvety continuous motion
        const normalizedDist = Math.min(1.0, absDist / focalZone);
        const smoothFactor = 0.5 * (1 + Math.cos(Math.PI * normalizedDist));

        // Smooth physical scaling & opacity without jarring jumps
        const scale = 0.95 + smoothFactor * 0.05; // 0.95 (idle) to 1.00 (active)
        const opacity = 0.50 + smoothFactor * 0.50; // 0.50 (dimmed) to 1.00 (crisp)
        const translateY = (distFromCenter / focalZone) * 10; // 10px subtle organic parallax travel

        // Direct hardware-accelerated transform injection
        cardEl.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        cardEl.style.opacity = opacity.toFixed(3);
      });

      // Update active stage on left panel with debounced focal switch
      if (closestIdx !== activeStepRef.current) {
        activeStepRef.current = closestIdx;
        setActiveStepIndex(closestIdx);
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateCardTransforms);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial compute on mount
    updateCardTransforms();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Smooth programmatic scroll to target stage
  const handleStepClick = useCallback((idx: number) => {
    setActiveStepIndex(idx);
    activeStepRef.current = idx;
    const targetEl = cardRefs.current[idx];
    if (targetEl) {
      const viewportHeight = window.innerHeight || 800;
      const rect = targetEl.getBoundingClientRect();
      const targetScrollY =
        window.scrollY + rect.top - (viewportHeight * 0.46 - rect.height / 2);
      window.scrollTo({
        top: targetScrollY,
        behavior: "smooth",
      });
    }
  }, []);

  const activeStep = PIPELINE_STEPS[activeStepIndex] || PIPELINE_STEPS[0];

  return (
    <section
      ref={sectionRef}
      className="w-full py-16 sm:py-24 border-t border-[#EBE5D8] dark:border-[#232E42] bg-[#FAF8F3] dark:bg-[#0B0F19] relative z-10 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] text-xs font-semibold text-[#5A6478] dark:text-[#94A3B8] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#E85D42] dark:bg-[#F06A50]" />
            <span>Deterministic RAG Execution Timeline</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#172033] dark:text-[#F8FAFC] tracking-[-0.015em] leading-snug sm:leading-snug max-w-3xl mx-auto">
            How a Voice Query Becomes a{" "}
            <span className="text-[#E85D42] dark:text-[#F06A50] underline decoration-[#FED7AA] dark:decoration-[#E85D42]/40 underline-offset-4 decoration-2">
              Grounded Answer
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[#5A6478] dark:text-[#94A3B8] leading-relaxed max-w-xl mx-auto pt-1">
            Scroll down to explore each stage of the sub-200ms deterministic multilingual pipeline.
          </p>
        </div>

        {/* Desktop Sticky 2-Column Story Layout / Mobile Linear Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Sticky Interactive Pipeline Visualizer */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="p-5 sm:p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#EBE5D8] dark:border-[#232E42] pb-3 mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC]">
                  Active Architecture
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#FAF8F3] dark:bg-[#0B0F19] text-[#E85D42] dark:text-[#F06A50] border border-[#EBE5D8] dark:border-[#232E42]">
                  STAGE {activeStep.number} / 06
                </span>
              </div>

              {/* Connected Pipeline Track */}
              <div className="space-y-2 relative">
                {PIPELINE_STEPS.map((stg, idx) => {
                  const isActive = activeStepIndex === idx;
                  const isPassed = activeStepIndex > idx;

                  return (
                    <div
                      key={stg.id}
                      onClick={() => handleStepClick(idx)}
                      className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#DDD5C4] dark:border-[#334155] shadow-sm translate-x-1"
                          : "hover:bg-[#FAF8F3]/60 dark:hover:bg-[#0B0F19]/40 border border-transparent"
                      }`}
                    >
                      {/* Node Icon Circle */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors duration-150 ${
                          isActive
                            ? "bg-[#FFFFFF] dark:bg-[#161F30] text-[#E85D42] dark:text-[#F06A50] border-2 border-[#E85D42] dark:border-[#F06A50] shadow-sm"
                            : isPassed
                            ? "bg-[#DCFCE7] dark:bg-[#14532D]/30 text-[#16A34A] dark:text-[#4ADE80] border border-[#BBF7D0] dark:border-[#14532D]"
                            : "bg-[#FAF8F3] dark:bg-[#0B0F19] text-[#8B95A5] dark:text-[#64748B] border border-[#EBE5D8] dark:border-[#232E42]"
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
                        ) : (
                          stg.number
                        )}
                      </div>

                      {/* Node Label */}
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-xs sm:text-sm font-bold truncate block ${
                            isActive ? "text-[#172033] dark:text-[#F8FAFC]" : "text-[#5A6478] dark:text-[#94A3B8]"
                          }`}
                        >
                          {stg.title}
                        </span>
                        <span className="text-[11px] text-[#8B95A5] dark:text-[#64748B] block truncate font-medium">
                          {stg.subtitle}
                        </span>
                      </div>

                      {isActive && (
                        <span className="h-2 w-2 rounded-full bg-[#E85D42] dark:bg-[#F06A50] shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Retrieval Chunk Selection Visualizer */}
              <div className="mt-5 pt-4 border-t border-[#EBE5D8] dark:border-[#232E42]">
                <span className="block text-[11px] font-bold text-[#5A6478] dark:text-[#94A3B8] mb-2">
                  Retrieval Selection Visualizer:
                </span>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] sm:text-xs font-mono">
                  <div
                    className={`p-2 rounded-lg border transition-colors duration-200 ${
                      activeStepIndex >= 2
                        ? "bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 border-[#BFDBFE] dark:border-[#1E3A8A] text-[#1D4ED8] dark:text-[#93C5FD] font-bold"
                        : "bg-[#FAF8F3] dark:bg-[#0B0F19] border-[#EBE5D8] dark:border-[#232E42] text-[#8B95A5] dark:text-[#64748B]"
                    }`}
                  >
                    Dense Vector Search
                  </div>
                  <div
                    className={`p-2 rounded-lg border transition-colors duration-200 ${
                      activeStepIndex >= 2
                        ? "bg-[#F0FDFA] dark:bg-[#134E4A]/30 border-[#99F6E4] dark:border-[#134E4A] text-[#0F766E] dark:text-[#5EEAD4] font-bold"
                        : "bg-[#FAF8F3] dark:bg-[#0B0F19] border-[#EBE5D8] dark:border-[#232E42] text-[#8B95A5] dark:text-[#64748B]"
                    }`}
                  >
                    BM25 Keyword Match
                  </div>
                  <div
                    className={`col-span-2 p-2 rounded-lg border transition-colors duration-200 ${
                      activeStepIndex >= 3
                        ? "bg-[#FEF3C7] dark:bg-[#78350F]/30 border-[#FDE68A] dark:border-[#78350F] text-[#B45309] dark:text-[#FCD34D] font-bold"
                        : "bg-[#FAF8F3] dark:bg-[#0B0F19] border-[#EBE5D8] dark:border-[#232E42] text-[#8B95A5] dark:text-[#64748B]"
                    }`}
                  >
                    RRF Fusion + Cross-Encoder Top 5
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Prominent Large Storytelling Cards */}
          <div className="lg:col-span-8 space-y-16 sm:space-y-24 pt-4 pb-[38vh]">
            {PIPELINE_STEPS.map((stg, idx) => {
              const isActive = activeStepIndex === idx;

              return (
                <div
                  key={stg.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  style={{
                    willChange: "transform, opacity",
                    transformOrigin: "center center",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  className={`p-7 sm:p-9 md:p-10 rounded-xl bg-[#FFFFFF] dark:bg-[#161F30] border ${
                    isActive
                      ? "border-[#DDD5C4] dark:border-[#475569] shadow-md ring-1 ring-[#E85D42]/20 dark:ring-[#F06A50]/20"
                      : "border-[#EBE5D8] dark:border-[#232E42] shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <span className={`text-xs font-bold px-3 py-1 rounded-md border ${stg.tagColor}`}>
                      STAGE {stg.number} • {stg.badge}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F3] dark:bg-[#0B0F19] border border-[#EBE5D8] dark:border-[#232E42] flex items-center justify-center shadow-sm shrink-0">
                      {stg.icon}
                    </div>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172033] dark:text-[#F8FAFC] mb-3 tracking-tight leading-snug">
                    {stg.title}
                  </h3>

                  <p className="text-sm sm:text-base text-[#5A6478] dark:text-[#94A3B8] leading-relaxed mb-6 font-normal">
                    {stg.description}
                  </p>

                  {/* Bullet Highlights */}
                  <div className="space-y-2.5 mb-6">
                    {stg.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-[#2D3748] dark:text-[#CBD5E1]">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] shrink-0 mt-0.5 sm:mt-0" />
                        <span className="font-medium">{detail}</span>
                      </div>
                    ))}
                  </div>

                  {/* Technology Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#EBE5D8] dark:border-[#232E42]">
                    <span className="text-xs uppercase font-bold text-[#8B95A5] dark:text-[#64748B] mr-1">
                      Engine:
                    </span>
                    {stg.techPills.map((pill, pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#FAF8F3] dark:bg-[#0B0F19] text-[#5A6478] dark:text-[#94A3B8] border border-[#EBE5D8] dark:border-[#232E42]"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
