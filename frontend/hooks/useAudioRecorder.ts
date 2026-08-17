import { useState, useRef, useEffect, useCallback } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioLevel: number;
  liveTranscript: string;
  finalTranscript: string;
  error: string | null;
}

// Helpers for WAV generation
function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number = 16000
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function encodeWAV(samples: Float32Array, sampleRate: number = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function useAudioRecorder(
  maxDurationSeconds: number = 30,
  languageCode: string = ""
) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioInputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const isStoppingRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (_) {}
      processorRef.current = null;
    }
    if (audioInputRef.current) {
      try {
        audioInputRef.current.disconnect();
      } catch (_) {}
      audioInputRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const normalized = Math.min(100, Math.round((avg / 255) * 100 * 2.5));
    setAudioLevel(normalized);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    // 1. Flush speech recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
    }

    // 2. Generate standard 16kHz WAV from accumulated PCM samples
    try {
      const chunks = pcmChunksRef.current;
      if (chunks.length > 0 && audioContextRef.current) {
        const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }

        const inputSampleRate = audioContextRef.current.sampleRate || 44100;
        const downsampled = downsampleBuffer(merged, inputSampleRate, 16000);
        const wavBlob = encodeWAV(downsampled, 16000);
        setAudioBlob(wavBlob);
      }
    } catch (wavErr) {
      console.warn("WAV encoding notice:", wavErr);
    }

    setIsRecording(false);
    cleanup();
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    setRecordingTime(0);
    pcmChunksRef.current = [];
    isStoppingRef.current = false;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone recording is not supported in this browser.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (constraintsErr) {
        console.warn("Retrying with standard audio constraints:", constraintsErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;

      // 1. Setup AudioContext, Analyser and ScriptProcessor for PCM WAV capture
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioContext = new AudioCtx();
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        audioInputRef.current = source;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        // Script processor for raw PCM capture (bufferSize=4096, 1 input channel, 1 output channel)
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          if (isStoppingRef.current) return;
          const inputData = e.inputBuffer.getChannelData(0);
          // Copy float32 array
          pcmChunksRef.current.push(new Float32Array(inputData));
        };
        source.connect(processor);
        processor.connect(audioContext.destination);
        processorRef.current = processor;
      }

      // 2. Setup In-Browser Speech Recognition (for immediate live voice feedback)
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;

          const langMap: Record<string, string> = {
            hi: "hi-IN",
            en: "en-IN",
            hinglish: "en-IN",
            bn: "bn-IN",
            ta: "ta-IN",
            te: "te-IN",
            mr: "mr-IN",
            gu: "gu-IN",
            kn: "kn-IN",
            ml: "ml-IN",
            pa: "pa-IN",
            or: "or-IN",
            as: "as-IN",
            ur: "ur-IN",
            sa: "sa-IN",
            ne: "ne-NP",
          };

          const targetCode = languageCode ? languageCode.toLowerCase().trim() : "";
          const resolvedLang =
            langMap[targetCode] ||
            (typeof navigator !== "undefined" && navigator.language
              ? navigator.language
              : "en-IN");
          recognition.lang = resolvedLang;

          recognition.onresult = (event: any) => {
            let interim = "";
            let final = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            if (final) {
              finalTranscriptRef.current = (
                finalTranscriptRef.current +
                " " +
                final
              ).trim();
            }
            const currentTranscript = (
              finalTranscriptRef.current +
              " " +
              interim
            ).trim();
            if (currentTranscript) {
              setLiveTranscript(currentTranscript);
            }
          };

          recognition.onerror = (e: any) => {
            console.warn("Live speech recognition notice:", e.error);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (recErr) {
          console.warn("Could not start in-browser speech recognition:", recErr);
        }
      }

      setIsRecording(true);

      // Start elapsed timer
      let seconds = 0;
      timerIntervalRef.current = setInterval(() => {
        seconds += 1;
        setRecordingTime(seconds);
        if (seconds >= maxDurationSeconds) {
          stopRecording();
        }
      }, 1000);

      // Start audio level visualizer
      if (analyserRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      }
    } catch (err: any) {
      cleanup();
      setIsRecording(false);
      setError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone access was denied. Please click the camera/mic icon in your browser address bar to allow microphone access."
          : err.message || "Failed to initialize microphone recording."
      );
    }
  }, [cleanup, languageCode, maxDurationSeconds, stopRecording, updateAudioLevel]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    recordingTime,
    audioBlob,
    audioLevel,
    liveTranscript,
    finalTranscript: finalTranscriptRef.current || liveTranscript,
    error,
    startRecording,
    stopRecording,
    clearAudio: () => {
      setAudioBlob(null);
      setLiveTranscript("");
      finalTranscriptRef.current = "";
      pcmChunksRef.current = [];
    },
  };
}

