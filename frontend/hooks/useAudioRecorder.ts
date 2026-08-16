import { useState, useRef, useEffect, useCallback } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioLevel: number;
  liveTranscript: string;
  error: string | null;
}

export function useAudioRecorder(maxDurationSeconds: number = 30, languageCode: string = "hi-IN") {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
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

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    setRecordingTime(0);
    audioChunksRef.current = [];

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
        console.warn("Retrying with simple audio constraints:", constraintsErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;

      // 1. Setup Web Audio API Analyser for live visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioContext = new AudioCtx();
          if (audioContext.state === "suspended") {
            await audioContext.resume();
          }
          audioContextRef.current = audioContext;

          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;
        }
      } catch (actxErr) {
        console.warn("AudioContext visualizer initialization notice:", actxErr);
      }

      // 2. Setup Live In-Browser Speech Recognition (for immediate live voice feedback)
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
          const resolvedLang = langMap[languageCode] || (typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-IN");
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
              finalTranscriptRef.current = (finalTranscriptRef.current + " " + final).trim();
            }
            const currentTranscript = (finalTranscriptRef.current + " " + interim).trim();
            setLiveTranscript(currentTranscript);
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

      // 3. Setup MediaRecorder for audio stream
      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || mimeType || "audio/webm";
        const finalBlob = new Blob(audioChunksRef.current, { type: finalType });
        setAudioBlob(finalBlob);
        setIsRecording(false);
        cleanup();
      };

      recorder.start(100);
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
  }, [cleanup, languageCode, maxDurationSeconds, updateAudioLevel]);

  const stopRecording = useCallback(() => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
  }, []);

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
    },
  };
}
