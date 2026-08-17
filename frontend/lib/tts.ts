/**
 * Isolated TTS (Text-to-Speech) Service for Voice RAG Application.
 * Supports multilingual Indian and English speech synthesis with clean citation stripping.
 */

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

class TTSManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

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
    return typeof window !== "undefined" && "speechSynthesis" in window;
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

  public speak(text: string, langCode: string, options: TTSOptions = {}): boolean {
    if (!this.isSupported()) {
      if (options.onError) options.onError(new Error("SpeechSynthesis not supported"));
      return false;
    }

    this.stop();

    const spokenText = cleanTextForNarration(text);
    if (!spokenText) {
      if (options.onEnd) options.onEnd();
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      const voice = this.findBestVoice(langCode);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = langCode.startsWith("hi") ? "hi-IN" : "en-IN";
      }

      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume !== undefined ? options.volume : 1.0;

      utterance.onstart = () => {
        if (options.onStart) options.onStart();
      };
      utterance.onend = () => {
        this.currentUtterance = null;
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

  public pause(): void {
    if (this.isSupported() && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (this.isSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  public stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.isSupported() && window.speechSynthesis.speaking;
  }

  public isPaused(): boolean {
    return this.isSupported() && window.speechSynthesis.paused;
  }
}

export const ttsService = new TTSManager();

/**
 * Public isolated speakAnswer abstraction required by design.
 */
export function speakAnswer(
  text: string,
  language: string,
  options?: TTSOptions
): boolean {
  return ttsService.speak(text, language, options);
}
