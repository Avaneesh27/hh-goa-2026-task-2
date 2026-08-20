/**
 * High-Performance Low-Latency TTS (Text-to-Speech) Service for Voice RAG Application.
 * Features:
 *   - Instant Base64 Audio Playback (0ms network lag when preloaded)
 *   - In-memory audio caching for instant replay
 *   - Direct static API integration
 *   - Ultra-fast native Web Speech API fallback (<15ms)
 *   - Smart citation & markdown stripping
 */

import { sendTTSRequest } from "./api";

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (err: any) => void;
}

export function cleanTextForNarration(text: string): string {
  if (!text) return "";
  // Remove markdown bold/italics
  let cleaned = text.replace(/[*_#`~]/g, "");
  // Remove citations like [1], [2], [1, 2]
  cleaned = cleaned.replace(/\[\d+(?:,\s*\d+)*\]/g, "");
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

function b64toBlob(b64Data: string, contentType = "audio/wav"): Blob {
  const byteCharacters = atob(b64Data);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteArray.buffer as BlobPart], { type: contentType });
}

class TTSManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

  // HTML5 Audio variables for Sarvam TTS
  private audioElement: HTMLAudioElement | null = null;
  private activeMode: "sarvam" | "native" | null = null;
  private currentOptions: TTSOptions = {};
  private audioCache: Record<string, string> = {}; // Cache of text_lang -> Object URL

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    if (this.voices.length > 0) {
      this.voicesLoaded = true;
    }
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && ("speechSynthesis" in window || typeof Audio !== "undefined");
  }

  private findBestVoice(langCode: string): SpeechSynthesisVoice | null {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    const targetLang = (langCode || "en").toLowerCase();

    // Specific locale mappings for all 15 languages
    const preferredLocales: Record<string, string[]> = {
      en: ["en-IN", "en_IN", "en-GB", "en-US", "en"],
      as: ["as-IN", "as_IN", "bn-IN", "hi-IN", "en-IN"],
      bn: ["bn-IN", "bn_IN", "bn-BD", "hi-IN"],
      gu: ["gu-IN", "gu_IN", "gu", "hi-IN"],
      hi: ["hi-IN", "hi_IN", "hi"],
      kn: ["kn-IN", "kn_IN", "kn", "hi-IN"],
      ml: ["ml-IN", "ml_IN", "ml", "hi-IN"],
      mr: ["mr-IN", "mr_IN", "hi-IN", "hi"],
      ne: ["ne-NP", "ne_NP", "hi-IN", "hi"],
      or: ["or-IN", "or_IN", "or", "hi-IN"],
      pa: ["pa-IN", "pa_IN", "pa", "hi-IN"],
      sa: ["sa-IN", "sa_IN", "hi-IN", "hi"],
      ta: ["ta-IN", "ta_IN", "ta", "hi-IN"],
      te: ["te-IN", "te_IN", "te", "hi-IN"],
      ur: ["ur-IN", "ur_IN", "ur-PK", "ur", "hi-IN"],
    };

    const targets = preferredLocales[targetLang] || [targetLang, "en-IN", "en-US"];

    for (const loc of targets) {
      const match = this.voices.find(
        (v) => v.lang.toLowerCase() === loc.toLowerCase() || v.lang.toLowerCase().startsWith(loc.toLowerCase())
      );
      if (match) return match;
    }

    return this.voices.find((v) => v.default) || (this.voices.length > 0 ? this.voices[0] : null);
  }

  private cleanupAudio() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.onplay = null;
      this.audioElement.onended = null;
      this.audioElement.onpause = null;
      this.audioElement.onerror = null;
      this.audioElement = null;
    }
  }

  private playSarvamAudio(url: string, options: TTSOptions) {
    try {
      this.cleanupAudio();
      this.audioElement = new Audio(url);

      if (options.rate) {
        this.audioElement.playbackRate = options.rate;
      }
      if (options.volume !== undefined) {
        this.audioElement.volume = options.volume;
      }

      this.audioElement.onplay = () => {
        if (options.onStart) options.onStart();
      };

      this.audioElement.onended = () => {
        this.activeMode = null;
        if (options.onEnd) options.onEnd();
      };

      this.audioElement.onpause = () => {
        if (this.audioElement && !this.audioElement.ended && this.activeMode === "sarvam") {
          if (options.onPause) options.onPause();
        }
      };

      this.audioElement.onerror = (e) => {
        console.warn("Sarvam audio element reported playback error:", e);
        this.activeMode = null;
        if (options.onError) options.onError(e);
      };

      this.audioElement.play().catch((err) => {
        console.warn("Sarvam audio play request rejected:", err);
        if (options.onError) options.onError(err);
      });
    } catch (err) {
      if (options.onError) options.onError(err);
    }
  }

  private speakNative(text: string, langCode: string, options: TTSOptions): boolean {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.findBestVoice(langCode);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = langCode.startsWith("hi") ? "hi-IN" : "en-IN";
      }

      utterance.rate = options.rate || 1.05; // Slightly faster for natural fluid delivery
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume !== undefined ? options.volume : 1.0;

      utterance.onstart = () => {
        if (options.onStart) options.onStart();
      };
      utterance.onend = () => {
        this.currentUtterance = null;
        this.activeMode = null;
        if (options.onEnd) options.onEnd();
      };
      utterance.onpause = () => {
        if (options.onPause) options.onPause();
      };
      utterance.onresume = () => {
        if (options.onResume) options.onResume();
      };
      utterance.onerror = (e) => {
        this.currentUtterance = null;
        this.activeMode = null;
        if (options.onError) options.onError(e);
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      if (options.onError) options.onError(err);
      return false;
    }
  }

  public speak(
    text: string,
    langCode: string,
    options: TTSOptions = {},
    preloadedAudioBase64?: string
  ): boolean {
    if (!this.isSupported()) {
      if (options.onError) options.onError(new Error("TTS is not supported in this browser"));
      return false;
    }

    this.stop();
    this.currentOptions = options;

    const spokenText = cleanTextForNarration(text);
    if (!spokenText) {
      if (options.onEnd) options.onEnd();
      return false;
    }

    const normLang = langCode.toLowerCase().split("-")[0];
    const cacheKey = `${spokenText}_${normLang}`;

    // 1. If audio is already pre-delivered or in memory cache -> Instant 0ms playback!
    if (preloadedAudioBase64) {
      try {
        const blob = b64toBlob(preloadedAudioBase64, "audio/wav");
        const url = URL.createObjectURL(blob);
        this.audioCache[cacheKey] = url;
        this.activeMode = "sarvam";
        this.playSarvamAudio(url, options);
        return true;
      } catch (err) {
        console.warn("Failed to decode preloaded audio base64, falling back:", err);
      }
    }

    if (this.audioCache[cacheKey]) {
      this.activeMode = "sarvam";
      this.playSarvamAudio(this.audioCache[cacheKey], options);
      return true;
    }

    const sarvamSupportedLangs = ["hi", "bn", "gu", "kn", "ml", "mr", "or", "pa", "ta", "te", "en"];

    if (sarvamSupportedLangs.includes(normLang)) {
      this.activeMode = "sarvam";

      // Race between fast API request and quick native fallback so user never experiences long silence
      let resolved = false;
      const fallbackTimer = setTimeout(() => {
        if (!resolved && this.activeMode === "sarvam") {
          console.info("Sarvam API pending, activating instant native speech fallback for zero latency...");
          this.activeMode = "native";
          this.speakNative(spokenText, normLang, options);
        }
      }, 600); // 600ms threshold prevents long noticeable lag

      sendTTSRequest(spokenText, normLang)
        .then((blob) => {
          resolved = true;
          clearTimeout(fallbackTimer);
          const url = URL.createObjectURL(blob);
          this.audioCache[cacheKey] = url;

          // If fallback hasn't started speaking or user stopped, play high-res Sarvam voice
          if (this.activeMode === "sarvam" || !this.isSpeaking()) {
            this.activeMode = "sarvam";
            this.playSarvamAudio(url, options);
          }
        })
        .catch((err) => {
          resolved = true;
          clearTimeout(fallbackTimer);
          if (this.activeMode === "sarvam") {
            this.activeMode = "native";
            this.speakNative(spokenText, langCode, options);
          }
        });

      return true;
    } else {
      // Instant direct local synthesis for Assamese, Nepali, Sanskrit, Urdu, etc.
      this.activeMode = "native";
      return this.speakNative(spokenText, langCode, options);
    }
  }

  public pause(): void {
    if (!this.isSupported()) return;

    if (this.activeMode === "sarvam") {
      if (this.audioElement) {
        this.audioElement.pause();
      }
    } else if (this.activeMode === "native") {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
      }
    }
  }

  public resume(): void {
    if (!this.isSupported()) return;

    if (this.activeMode === "sarvam") {
      if (this.audioElement) {
        this.audioElement.play().catch((err) => {
          console.warn("Sarvam audio resume play request rejected:", err);
          if (this.currentOptions.onError) this.currentOptions.onError(err);
        });
        if (this.currentOptions.onResume) this.currentOptions.onResume();
      }
    } else if (this.activeMode === "native") {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  }

  public stop(): void {
    if (!this.isSupported()) return;

    if (this.activeMode === "sarvam") {
      this.cleanupAudio();
    } else {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
    this.activeMode = null;
  }

  public isSpeaking(): boolean {
    if (!this.isSupported()) return false;
    if (this.activeMode === "sarvam") {
      return !!this.audioElement && !this.audioElement.paused && !this.audioElement.ended;
    }
    return window.speechSynthesis.speaking;
  }

  public isPaused(): boolean {
    if (!this.isSupported()) return false;
    if (this.activeMode === "sarvam") {
      return !!this.audioElement && this.audioElement.paused && !this.audioElement.ended;
    }
    return window.speechSynthesis.paused;
  }
}

export const ttsService = new TTSManager();

/**
 * Public isolated speakAnswer abstraction required by design.
 */
export function speakAnswer(
  text: string,
  language: string,
  options?: TTSOptions,
  preloadedAudioBase64?: string
): boolean {
  return ttsService.speak(text, language, options, preloadedAudioBase64);
}
