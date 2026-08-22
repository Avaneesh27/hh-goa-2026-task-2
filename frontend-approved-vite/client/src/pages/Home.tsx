/**
 * Field Notes / Signal design reminder:
 * Build this page as an editorial research instrument—warm paper, ink precision,
 * Rekha Coral signal states, asymmetric composition, and motion that reveals RAG state.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileSearch,
  Languages,
  Mic,
  Search,
  ShieldCheck,
  Sparkles,
  Volume2,
  Waves,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fullSequenceFrames } from "@/lib/fullSequenceFrames";
import { textQuery, voiceQuery, textToSpeech, type RAGResponse } from "@/lib/ragApi";
import PipelineCards from "@/components/PipelineCards";
import SignalStory from "@/components/SignalStory";
import LanguageStory from "@/components/LanguageStory";

type Language = {
  code: string;
  name: string;
  native: string;
  sample: string;
};

const languages: Language[] = [
  { code: "AUTO", name: "Auto detect", native: "Any Indic language", sample: "What is a corporation?" },
  { code: "HI", name: "Hindi", native: "हिंदी", sample: "कॉर्पोरेशन क्या होता है?" },
  { code: "MR", name: "Marathi", native: "मराठी", sample: "कॉर्पोरेशन म्हणजे काय?" },
  { code: "BN", name: "Bengali", native: "বাংলা", sample: "কর্পোরেশন কী?" },
  { code: "TA", name: "Tamil", native: "தமிழ்", sample: "கார்ப்பரேஷன் என்றால் என்ன?" },
  { code: "TE", name: "Telugu", native: "తెలుగు", sample: "కార్పొరేషన్ అంటే ఏమిటి?" },
];

const examples = [
  { label: "Marathi", code: "MR", text: "कॉर्पोरेशन म्हणजे काय?" },
  { label: "Hindi", code: "HI", text: "GST का क्या मतलब है?" },
  { label: "Bengali", code: "BN", text: "সংবিধান কী?" },
  { label: "English", code: "AUTO", text: "How does a corporation work?" },
];

const waveform = [38, 58, 31, 77, 50, 88, 42, 67, 33, 72, 48, 86, 36, 64, 43, 76, 54, 69, 35, 61, 46, 79];

const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const primarySequenceFrames = fullSequenceFrames.slice(0, 100);

function ScrollSequenceChapter() {
  const chapterRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const [stageMode, setStageMode] = useState<"before" | "pinned" | "after">("before");
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: chapterRef,
    offset: ["start start", "end end"],
  });

  // Silky-smooth spring physics for scroll scrubbing
  const smoothedProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.2,
    restDelta: 0.0001,
  });

  const copyOffset = useTransform(smoothedProgress, [0, 1], [0, -44]);

  // Preload all frames into memory
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    primarySequenceFrames.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (idx === 0) drawFrame(0);
      };
      images.push(img);
    });
    imagesRef.current = images;

    return () => {
      images.forEach((img) => { img.src = ""; });
    };
  }, []);

  // Draw frame with object-fit: cover logic to the GPU canvas
  const drawFrame = (frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[frameIdx] || imagesRef.current[0];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = w / h;

    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;

    if (canvasRatio > imgRatio) {
      drawW = w;
      drawH = w / imgRatio;
      drawX = 0;
      drawY = (h - drawH) / 2;
    } else {
      drawH = h;
      drawW = h * imgRatio;
      drawX = (w - drawW) / 2;
      drawY = 0;
    }

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
    currentFrameRef.current = frameIdx;
  };

  // Subscribe to progress change to update canvas smoothly
  useMotionValueEvent(smoothedProgress, "change", (latest) => {
    if (reducedMotion) return;
    const frameIndex = Math.min(
      primarySequenceFrames.length - 1,
      Math.max(0, Math.round(latest * (primarySequenceFrames.length - 1)))
    );
    if (frameIndex !== currentFrameRef.current) {
      requestAnimationFrame(() => drawFrame(frameIndex));
    }
  });

  // Resize listener to re-render frame sharply on window resize
  useEffect(() => {
    const handleResize = () => drawFrame(currentFrameRef.current);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update pin stage mode
  useEffect(() => {
    const updateStageMode = () => {
      const chapter = chapterRef.current;
      if (!chapter) return;
      const bounds = chapter.getBoundingClientRect();
      const headerOffset = window.innerWidth <= 760 ? 72 : 84;

      if (bounds.top > headerOffset) {
        setStageMode("before");
      } else if (bounds.bottom <= window.innerHeight) {
        setStageMode("after");
      } else {
        setStageMode("pinned");
      }
    };

    updateStageMode();
    window.addEventListener("scroll", updateStageMode, { passive: true });
    window.addEventListener("resize", updateStageMode);
    return () => {
      window.removeEventListener("scroll", updateStageMode);
      window.removeEventListener("resize", updateStageMode);
    };
  }, []);

  return (
    <section
      ref={chapterRef}
      className="sequence-chapter primary-parallax"
      id="voice-assembly"
      aria-labelledby="sequence-title"
    >
      <div className={`sequence-sticky sequence-stage-${stageMode}`}>
        <div className="sequence-frame" aria-hidden="true">
          <canvas
            ref={canvasRef}
            className="sequence-canvas"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              transform: "scale(1.02)",
            }}
          />
        </div>
        <div className="sequence-scrim" aria-hidden="true" />
        <div className="sequence-noise" aria-hidden="true" />
        <motion.div className="sequence-layout" style={{ y: copyOffset }}>
          <div className="sequence-copy">
            <div className="sequence-eyebrow"><span>VOICE RESEARCH INTERFACE</span></div>
            <h2 id="sequence-title">Voice becomes<br /><em>a trace.</em></h2>
            <p>
              The microphone is the main visual system. Stay with it as the full sequence moves through capture, deconstruction, and resolution—then release into the retrieval experience.
            </p>
            <div className="sequence-rule" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const [query, setQuery] = useState("Ask about the world in the language you think in.");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAnswer, setHasAnswer] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);

  // Real RAG response from backend
  const [ragResponse, setRagResponse] = useState<RAGResponse | null>(null);
  // Error message for network/API failures
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Hero / Voice Station Choreographed Scroll Story ────────────────────────
  const heroSectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end end"],
  });

  const smoothHero = useSpring(heroScrollProgress, {
    stiffness: 85,
    damping: 26,
    mass: 0.2,
    restDelta: 0.0001,
  });

  // 1. Hero block: starts 100% wide/centered, shrinks to 50% left column
  const heroCopyWidth = useTransform(smoothHero, [0.10, 0.32], ["100%", "50%"]);
  const heroInitialOpacity = useTransform(smoothHero, [0.08, 0.22], [1, 0]);
  const heroRestingOpacity = useTransform(smoothHero, [0.18, 0.32], [0, 1]);

  // ── 2. Four sample question boxes enter from FOUR DIFFERENT DIRECTIONS ───────
  const samplesTagOpacity = useTransform(smoothHero, [0.30, 0.42], [0, 1]);
  const samplesTagY = useTransform(smoothHero, [0.30, 0.42], [-15, 0]);

  // Box 0 (Marathi, Top-Left): Enters from LEFT (x: -180%, y: -30%)
  const box0X = useTransform(smoothHero, [0.30, 0.48], ["-180%", "0%"]);
  const box0Y = useTransform(smoothHero, [0.30, 0.48], ["-30%", "0%"]);
  const box0Rotate = useTransform(smoothHero, [0.30, 0.48], [-6, 0]);
  const box0Opacity = useTransform(smoothHero, [0.30, 0.45], [0, 1]);

  // Box 1 (Hindi, Top-Right): Enters from TOP (x: 20%, y: -180%)
  const box1X = useTransform(smoothHero, [0.33, 0.50], ["20%", "0%"]);
  const box1Y = useTransform(smoothHero, [0.33, 0.50], ["-180%", "0%"]);
  const box1Rotate = useTransform(smoothHero, [0.33, 0.50], [5, 0]);
  const box1Opacity = useTransform(smoothHero, [0.33, 0.47], [0, 1]);

  // Box 2 (Bengali, Bottom-Left): Enters from BOTTOM (x: -20%, y: 180%)
  const box2X = useTransform(smoothHero, [0.36, 0.53], ["-20%", "0%"]);
  const box2Y = useTransform(smoothHero, [0.36, 0.53], ["180%", "0%"]);
  const box2Rotate = useTransform(smoothHero, [0.36, 0.53], [-5, 0]);
  const box2Opacity = useTransform(smoothHero, [0.36, 0.50], [0, 1]);

  // Box 3 (English, Bottom-Right): Enters from RIGHT (x: 180%, y: 30%)
  const box3X = useTransform(smoothHero, [0.39, 0.56], ["180%", "0%"]);
  const box3Y = useTransform(smoothHero, [0.39, 0.56], ["30%", "0%"]);
  const box3Rotate = useTransform(smoothHero, [0.39, 0.56], [6, 0]);
  const box3Opacity = useTransform(smoothHero, [0.39, 0.53], [0, 1]);

  const boxMotions = [
    { x: box0X, y: box0Y, rotate: box0Rotate, opacity: box0Opacity },
    { x: box1X, y: box1Y, rotate: box1Rotate, opacity: box1Opacity },
    { x: box2X, y: box2Y, rotate: box2Rotate, opacity: box2Opacity },
    { x: box3X, y: box3Y, rotate: box3Rotate, opacity: box3Opacity },
  ];

  // 3. Voice station arrives from depth after the 4 boxes align (0.54 -> 0.72)
  const stationScale = useTransform(smoothHero, [0.54, 0.72], [0.85, 1]);
  const stationOpacity = useTransform(smoothHero, [0.54, 0.70], [0, 1]);
  const stationZ = useTransform(smoothHero, [0.54, 0.72], [-120, 0]);

  // ── Navbar visibility: sticky at top, hides during scroll animations ───────
  const [isNavHidden, setIsNavHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const micElement = document.getElementById("voice-assembly");
      const pipeElement = document.getElementById("how-it-works");

      let hide = false;

      // 1. Hide during the microphone scroll sequence
      if (micElement) {
        const bounds = micElement.getBoundingClientRect();
        if (window.scrollY > 30 && bounds.top <= 80 && bounds.bottom > 120) {
          hide = true;
        }
      }

      // 2. Hide during the 3D pipeline card animation
      if (!hide && pipeElement) {
        const bounds = pipeElement.getBoundingClientRect();
        if (bounds.top <= 60 && bounds.bottom > window.innerHeight * 0.85) {
          hide = true;
        }
      }

      setIsNavHidden(hide);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // MediaRecorder for mic recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // TTS audio element for playback
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsObjectUrlRef = useRef<string | null>(null);

  // Live transcript from browser SpeechRecognition (fallback for STT)
  const liveTranscriptRef = useRef<string>("");

  const queryWords = useMemo(
    () => query.split(" ").filter((word) => word.length > 3).slice(0, 3),
    [query],
  );

  const pointerStyle = {} as CSSProperties;

  // Map frontend language code to backend language code
  const getBackendLang = (code: string): string | undefined => {
    if (code === "AUTO") return undefined;
    return code.toLowerCase();
  };

  // ── Narration state: stop audio when isNarrating turns false ──────────────
  useEffect(() => {
    if (!isNarrating) {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      if (ttsObjectUrlRef.current) {
        URL.revokeObjectURL(ttsObjectUrlRef.current);
        ttsObjectUrlRef.current = null;
      }
    }
  }, [isNarrating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ttsObjectUrlRef.current) URL.revokeObjectURL(ttsObjectUrlRef.current);
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    };
  }, []);

  const chooseLanguage = (language: Language) => {
    setSelectedLanguage(language);
    setIsLanguageOpen(false);
    if (language.code !== "AUTO") setQuery(language.sample);
  };

  const useExample = (code: string, text: string) => {
    const language = languages.find((item) => item.code === code) ?? languages[0];
    setSelectedLanguage(language);
    setQuery(text);
    setHasAnswer(false);
    setIsListening(false);
    setRagResponse(null);
    setErrorMessage(null);
  };

  // ── Handle real RAG response ───────────────────────────────────────────────
  const handleRagResponse = (resp: RAGResponse) => {
    setRagResponse(resp);
    // If the backend transcribed speech, update the query display
    if (resp.transcript && resp.transcript !== "(audio unrecognizable)") {
      setQuery(resp.transcript);
    }
    setIsProcessing(false);
    setHasAnswer(true);
    setErrorMessage(null);
  };

  // ── Text query via Find an answer button ──────────────────────────────────
  const processQuestion = async () => {
    if (!query.trim() || isProcessing) return;
    setIsListening(false);
    setHasAnswer(false);
    setRagResponse(null);
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const lang = getBackendLang(selectedLanguage.code);
      const resp = await textQuery(query, lang);
      handleRagResponse(resp);
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : "Request failed");
    }
  };

  // ── Mic button: start/stop recording ─────────────────────────────────────
  const toggleListening = async () => {
    if (isListening) {
      // Stop recording — MediaRecorder ondataavailable fires, then onstop sends to backend
      mediaRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Reset state
    setHasAnswer(false);
    setRagResponse(null);
    setErrorMessage(null);
    liveTranscriptRef.current = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Prefer webm/opus if supported, fall back to whatever the browser gives
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      // Optional: use browser SpeechRecognition as transcript fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI: any =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let recognition: any = null;
      if (SpeechRecognitionAPI) {
        recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let partial = "";
          for (let i = 0; i < event.results.length; i++) {
            partial += event.results[i][0].transcript;
          }
          liveTranscriptRef.current = partial;
        };
        try { recognition.start(); } catch { /* ignore if already started */ }
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop browser SpeechRecognition
        try { recognition?.stop(); } catch { /* ignore */ }
        // Stop all mic tracks
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (blob.size < 100) {
          setErrorMessage("Recording too short — please try again.");
          return;
        }

        setIsProcessing(true);
        setHasAnswer(false);
        try {
          const lang = getBackendLang(selectedLanguage.code);
          const fallback = liveTranscriptRef.current.trim() || undefined;
          const resp = await voiceQuery(blob, lang, fallback);
          handleRagResponse(resp);
        } catch (err) {
          setIsProcessing(false);
          setErrorMessage(err instanceof Error ? err.message : "Voice query failed");
        }
      };

      recorder.start(250); // collect chunks every 250ms
      setIsListening(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Microphone permission denied."
          : "Could not start recording."
      );
    }
  };

  // ── Narrate button: TTS playback ──────────────────────────────────────────
  const toggleNarrate = async () => {
    if (isNarrating) {
      setIsNarrating(false); // useEffect will pause/cleanup audio
      return;
    }

    const answerText = ragResponse?.answer ?? "";
    if (!answerText) return;

    const lang = ragResponse?.language ?? getBackendLang(selectedLanguage.code) ?? "en";

    setIsNarrating(true);
    try {
      const url = await textToSpeech(answerText, lang);
      ttsObjectUrlRef.current = url;

      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.onended = () => setIsNarrating(false);
      audio.onerror = () => setIsNarrating(false);
      await audio.play();
    } catch {
      // TTS API failed — fall back to browser speech synthesis
      if ("speechSynthesis" in window) {
        const utt = new SpeechSynthesisUtterance(answerText);
        utt.onend = () => setIsNarrating(false);
        window.speechSynthesis.speak(utt);
      } else {
        setIsNarrating(false);
      }
    }
  };

  return (
    <div
      className="field-notes-shell"
      style={pointerStyle}
    >
      <a className="skip-link" href="#voice-station">
        Skip to the voice station
      </a>

      <header className={`site-header ${isNavHidden ? "is-hidden" : ""}`}>
        <div className="site-header-inner">
          <a className="brand-lockup" href="#top" aria-label="HH Goa Voice RAG home">
            <span className="brand-mark-wrap">
              <img src="/manus-storage/signal-ring-logo_96dd7941.png" alt="" className="brand-mark" />
            </span>
            <span className="brand-wordmark">HH / VOICE RAG</span>
          </a>

          <nav className="top-nav" aria-label="Primary navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#evidence">Evidence</a>
            <a href="#languages">Languages</a>
          </nav>

          <div className="header-status" aria-label="System status">
            <span className="status-dot" />
            <span>Demo interface</span>
          </div>
        </div>
      </header>

      <main id="top">
        <ScrollSequenceChapter />

        <section
          ref={heroSectionRef}
          className="hero-scroll-section"
          id="voice-station-section"
          aria-labelledby="hero-title"
        >
          <div className="hero-sticky">
            <div className="hero-grid">
              {/* Left Column: Dual-Mode Editorial Copy & Sample Boxes */}
              <motion.div
                className="hero-copy"
                style={{
                  width: heroCopyWidth,
                }}
              >
                {/* ── A: INITIAL HERO MODE (Wide, Centered, Spanned & Colorful) ── */}
                <motion.div
                  className="hero-hero-view"
                  style={{
                    opacity: heroInitialOpacity,
                  }}
                >
                  <div className="eyebrow">
                    <span className="eyebrow-number">02</span>
                    <span>Hacker House Goa · 2026</span>
                    <span className="hero-eyebrow-sep">/</span>
                    <Sparkles size={14} className="hero-sparkle-icon" />
                    <span>VOICE RETRIEVAL SYSTEM</span>
                  </div>

                  <h1 className="hero-hero-headline">
                    Ask in the <span className="hero-word-mono">language</span> you{" "}
                    <em className="hero-word-serif-coral">think</em>{" "}
                    <span className="hero-word-display-mango">in.</span>
                  </h1>

                  <p className="hero-hero-lede">
                    A <span className="ss-hl-pill coral">voice-led</span> research interface
                    that turns an Indian-language question into an answer you can{" "}
                    <span className="ss-hl-pill mango">trace back</span> to its{" "}
                    <span className="ss-hl-pill leaf">evidence</span>.
                  </p>

                  <div className="hero-hero-proof">
                    <div className="hero-proof-card">
                      <span className="proof-label">Built around</span>
                      <strong>AI4Bharat MSMARCO-XI</strong>
                    </div>
                    <div className="hero-proof-card">
                      <span className="proof-label">Answer policy</span>
                      <strong>Evidence, or an honest “I don’t know.”</strong>
                    </div>
                  </div>
                </motion.div>

                {/* ── B: RESTING MODE (Left-aligned, standard clean typography) ── */}
                <motion.div
                  className="hero-resting-view"
                  style={{
                    opacity: heroRestingOpacity,
                  }}
                >
                  <div className="eyebrow">
                    <span className="eyebrow-number">02</span>
                    <span>Hacker House Goa · 2026</span>
                  </div>

                  <h1 id="hero-title">
                    Ask in the language
                    <em> you think in.</em>
                  </h1>

                  <p className="hero-lede">
                    A voice-led research interface that turns an Indian-language question into an answer you can trace back to its evidence.
                  </p>

                  <div className="hero-proof">
                    <div>
                      <span className="proof-label">Built around</span>
                      <strong>AI4Bharat MSMARCO-XI</strong>
                    </div>
                    <div>
                      <span className="proof-label">Answer policy</span>
                      <strong>Evidence, or an honest “I don’t know.”</strong>
                    </div>
                  </div>
                </motion.div>

                {/* ── C: 4 Sample Question Boxes (Enter from 4 Different Directions) ── */}
                <div className="sample-queries">
                  <motion.div
                    className="section-tag"
                    style={{
                      opacity: samplesTagOpacity,
                      y: samplesTagY,
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Try a real question</span>
                  </motion.div>
                  <div className="sample-grid">
                    {examples.map((example, index) => {
                      const motionStyle = boxMotions[index] || boxMotions[0];
                      return (
                        <motion.button
                          type="button"
                          className="sample-query"
                          key={example.label}
                          onClick={() => useExample(example.code, example.text)}
                          style={{
                            x: motionStyle.x,
                            y: motionStyle.y,
                            rotate: motionStyle.rotate,
                            opacity: motionStyle.opacity,
                          }}
                        >
                          <span className="sample-language">{example.label}</span>
                          <span className="sample-text">{example.text}</span>
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Main Voice Station (Arrives from Depth) */}
              <motion.div
                id="voice-station"
                className={`voice-station ${isListening ? "is-listening" : ""} ${isProcessing ? "is-processing" : ""} ${hasAnswer ? "has-answer" : ""}`}
                style={{
                  scale: stationScale,
                  opacity: stationOpacity,
                  z: stationZ,
                }}
              >
                <img src="/manus-storage/voice-rag-hero-field_911f3d5b.jpg" alt="" className="station-art" />
                <div className="station-scrim" />

                <div className="station-topbar">
                  <div className="station-id">
                    <span className="station-index">VOICE STATION / 01</span>
                    <span className="station-state">
                      <span className={`station-state-dot ${isListening ? "live" : ""}`} />
                      {isProcessing ? "Finding evidence" : isListening ? "Listening now" : hasAnswer ? "Grounded answer ready" : "Ready for a question"}
                    </span>
                  </div>

                <div className="language-picker">
                  <button
                    type="button"
                    className="language-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={isLanguageOpen}
                    onClick={() => setIsLanguageOpen((open) => !open)}
                  >
                    <Languages size={16} />
                    <span>{selectedLanguage.name}</span>
                    <ChevronDown size={16} />
                  </button>

                  {isLanguageOpen && (
                    <div className="language-menu" role="listbox" aria-label="Input language">
                      {languages.map((language) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedLanguage.code === language.code}
                          className={`language-option ${selectedLanguage.code === language.code ? "selected" : ""}`}
                          key={language.code}
                          onClick={() => chooseLanguage(language)}
                        >
                          <span>
                            <strong>{language.name}</strong>
                            <small>{language.native}</small>
                          </span>
                          {selectedLanguage.code === language.code && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!hasAnswer ? (
                <div className="voice-input-state">
                  <label className="query-label" htmlFor="voice-query">
                    <span>Your question</span>
                    <span>{selectedLanguage.code === "AUTO" ? "Language: unknown" : `Language: ${selectedLanguage.native}`}</span>
                  </label>
                  <textarea
                    id="voice-query"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setHasAnswer(false);
                    }}
                    onFocus={() => setIsListening(false)}
                    rows={3}
                    aria-label="Your question"
                  />

                  <div className="signal-field" aria-label={isListening ? "Animated voice signal" : "Voice input signal preview"}>
                    <div className="waveform" aria-hidden="true">
                      {waveform.map((height, index) => (
                        <span
                          className="wave-bar"
                          key={`${height}-${index}`}
                          style={{ "--bar-scale": height / 100, "--bar-delay": `${index * 0.035}s` } as CSSProperties}
                        />
                      ))}
                    </div>
                    <span className="signal-caption">{isListening ? "Capturing your voice…" : "Voice input, with a typed fallback"}</span>
                  </div>

                  <div className="station-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      className="listen-button"
                      aria-pressed={isListening}
                      onClick={toggleListening}
                    >
                      {isListening ? <Waves size={19} /> : <Mic size={19} />}
                      <span>{isListening ? "Listening… tap to stop" : "Try the microphone"}</span>
                    </Button>
                    <Button type="button" className="ask-button" onClick={processQuestion} disabled={isProcessing}>
                      {isProcessing ? <span className="spinner-dot" /> : <Search size={18} />}
                      <span>{isProcessing ? "Searching evidence" : "Find an answer"}</span>
                      <ArrowDownRight size={17} />
                    </Button>
                  </div>
                </div>
              ) : (
                <motion.div
                  className="answer-state"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div className="transcript-row">
                    <div className="transcript-mark"><Mic size={15} /></div>
                    <div>
                      <span>You said</span>
                      <p>{ragResponse?.transcript ?? query}</p>
                    </div>
                    <button type="button" className="reset-query" onClick={() => { setHasAnswer(false); setRagResponse(null); setErrorMessage(null); }}>
                      <X size={15} />
                      Ask another
                    </button>
                  </div>

                  <div className="grounded-answer">
                    <div className="answer-heading">
                      <span className="grounded-pill">
                        <ShieldCheck size={14} /> {ragResponse?.abstained ? "Abstained — no evidence" : "Grounded in context"}
                      </span>
                      <button
                        type="button"
                        className={`narrate-button ${isNarrating ? "is-playing" : ""}`}
                        aria-pressed={isNarrating}
                        onClick={toggleNarrate}
                      >
                        {isNarrating ? <Waves size={15} /> : <Volume2 size={15} />}
                        {isNarrating ? "Playing" : "Listen"}
                      </button>
                    </div>
                    <p>
                      {ragResponse?.answer ?? ""}
                    </p>
                  </div>

                  <div className="answer-evidence" id="evidence">
                    <div className="evidence-label">
                      <FileSearch size={14} /> Evidence selected · {ragResponse?.retrieval?.selected_count ?? 0}
                    </div>
                    <div className="evidence-slips">
                      {ragResponse?.evidence && ragResponse.evidence.length > 0 ? (
                        ragResponse.evidence.map((chunk, idx) => (
                          <article
                            key={chunk.chunk_id ?? idx}
                            className={`evidence-slip ${idx % 2 === 0 ? "coral-edge" : "green-edge"}`}
                          >
                            <span className="slip-index">[{String(idx + 1).padStart(2, "0")}]</span>
                            <p>"{chunk.text}"</p>
                            <span className="slip-meta">
                              {chunk.language?.toUpperCase()} · {chunk.citation_id ?? chunk.chunk_id}
                            </span>
                          </article>
                        ))
                      ) : (
                        <article className="evidence-slip coral-edge">
                          <span className="slip-index">[—]</span>
                          <p>{ragResponse?.abstained ? "No supporting evidence found in corpus." : "No evidence chunks returned."}</p>
                          <span className="slip-meta">RAG System</span>
                        </article>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="station-footer">
                <span>
                  <Clock3 size={13} />{" "}
                  {hasAnswer && ragResponse
                    ? `${Math.round(ragResponse.latency.end_to_end_ms)}ms · Evidence path complete`
                    : errorMessage
                    ? `Error: ${errorMessage}`
                    : "Demo flow · no audio is transmitted"}
                </span>
                <span><CircleHelp size={13} /> Why evidence matters</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


        <PipelineCards />


        <SignalStory queryWords={queryWords} />

        <LanguageStory />

        <section className="abstain-section" aria-labelledby="abstain-title">
          <motion.div
            className="abstain-stamp"
            initial={{ opacity: 0, scale: 0.92, rotate: -8 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -4 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
          >
            <span>NO EVIDENCE</span>
            <strong>NO<br />GUESSING</strong>
          </motion.div>
          <div className="abstain-copy">
            <div className="eyebrow"><span className="eyebrow-number">TRUST / 00</span><span>An answer is not the only good outcome</span></div>
            <h2 id="abstain-title">A clear “I don’t know” is part of the product.</h2>
            <p>When the corpus cannot support a response, the interface stops with the same clarity it uses for a grounded answer. Trust is a visible design decision, not a hidden prompt instruction.</p>
            <div className="abstain-rule"><span>Grounding check</span><b /><span>Answer or abstain</span></div>
          </div>
        </section>

        <section className="operating-notes" aria-label="Product principles">
          <div className="notes-head">
            <span className="eyebrow-number">FIELD NOTES</span>
            <p>Designed for a demo that earns trust before it asks for it.</p>
          </div>
          <div className="note-list">
            <div><span>01</span><p>Voice input is treated as a first-class interaction, not an add-on button.</p></div>
            <div><span>02</span><p>Evidence is visible, compact, and legible enough to inspect.</p></div>
            <div><span>03</span><p>Motion communicates state; it never obscures the next action.</p></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/manus-storage/signal-ring-logo_96dd7941.png" alt="" />
          <span>HH / VOICE RAG</span>
        </div>
        <p>Voice → evidence → grounded answer.</p>
        <span className="footer-stamp">TASK 02 · UI CONCEPT</span>
      </footer>
    </div>
  );
}
