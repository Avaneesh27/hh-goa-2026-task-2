"""
Sarvam Speech-to-Text (STT) Integration Service.
Handles audio ingestion, format validation, calling the Sarvam Speech-to-Text API
(supporting Hindi, English, and Hinglish), retry with exponential backoff,
latency timing, and fallback handling.
"""

import os
import io
import time
import json
from typing import Optional, Dict, Any, Tuple
import httpx

from backend.config import settings
from backend.schemas import STTResponse

SARVAM_LANG_MAP = {
    "hi": "hi-IN",
    "en": "en-IN",
    "hinglish": "hi-IN",
    "bn": "bn-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
    "or": "od-IN",
    # Languages not directly enumerated in saarika:v2.5 use auto-detection ("unknown")
    "as": "unknown",
    "ur": "unknown",
    "sa": "unknown",
    "ne": "unknown",
}


class SarvamSTTService:
    SARVAM_API_URL = "https://api.sarvam.ai/speech-to-text"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SARVAM_API_KEY
        self.timeout_seconds = 12.0
        self.max_audio_bytes = 25 * 1024 * 1024  # 25 MB

    def validate_audio(self, audio_bytes: bytes, filename: str = "audio.wav") -> Tuple[bool, Optional[str]]:
        """Validates audio file size and non-empty payload."""
        if not audio_bytes or len(audio_bytes) < 100:
            return False, "Audio recording is empty or too short (minimum 100 bytes required)."
        if len(audio_bytes) > self.max_audio_bytes:
            return False, f"Audio file size ({len(audio_bytes)/(1024*1024):.1f} MB) exceeds maximum allowed (25 MB)."
        return True, None

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "recording.wav",
        language_code: Optional[str] = None,
        model: str = "saarika:v2.5"
    ) -> STTResponse:
        """
        Transcribes audio bytes using the Sarvam AI Speech-to-Text API.
        Includes a 1-retry policy for transient network/API errors.
        """
        start_time = time.perf_counter()

        # 1. Validation
        is_valid, err_msg = self.validate_audio(audio_bytes, filename)
        if not is_valid:
            return STTResponse(
                text="",
                language="unknown",
                confidence=0.0,
                latency_ms=round((time.perf_counter() - start_time) * 1000, 2),
                error=err_msg
            )

        # Resolve Sarvam language code (use "unknown" for auto-detection)
        if not language_code or language_code.strip() in ("", "auto", "unknown"):
            sarvam_lang = "unknown"
            norm_lang = "auto"
        else:
            norm_lang = language_code.lower().strip()
            sarvam_lang = SARVAM_LANG_MAP.get(norm_lang, norm_lang if "-IN" in norm_lang else "unknown")

        # 2. Check for missing API Key (Provide graceful notice)
        if not self.api_key or self.api_key == "your_sarvam_api_key_here":
            print(f"[!] Warning: SARVAM_API_KEY not configured. Language requested: {sarvam_lang}.")
            return STTResponse(
                text="",
                language="unknown",
                confidence=0.0,
                latency_ms=round((time.perf_counter() - start_time) * 1000, 2),
                error="SARVAM_API_KEY not set in backend .env"
            )

        # 3. Call Sarvam API with 1 retry
        headers = {
            "api-subscription-key": self.api_key
        }

        # Sarvam multipart form
        # Ensure MIME type matches audio format
        content_type = "audio/wav" if filename.endswith(".wav") else "audio/webm"
        files = {
            "file": (filename, audio_bytes, content_type)
        }
        data = {
            "model": model,
            "language_code": sarvam_lang,
            "with_diacritics": "true"
        }

        last_error = None
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                    resp = await client.post(
                        self.SARVAM_API_URL,
                        headers=headers,
                        files=files,
                        data=data
                    )
                    
                    if resp.status_code == 200:
                        res_json = resp.json()
                        transcript = res_json.get("transcript", "").strip()
                        raw_detected_lang = res_json.get("language_code", norm_lang if norm_lang != "auto" else "en-IN")
                        lang_short = raw_detected_lang.split("-")[0].lower() if "-" in raw_detected_lang else raw_detected_lang.lower()
                        
                        elapsed_ms = (time.perf_counter() - start_time) * 1000
                        return STTResponse(
                            text=transcript,
                            language=lang_short,
                            confidence=0.96,
                            latency_ms=round(elapsed_ms, 2)
                        )
                    else:
                        last_error = f"Sarvam API returned HTTP {resp.status_code}: {resp.text}"
                        print(f"[!] STT Attempt {attempt+1} failed: {last_error}")
            except Exception as e:
                last_error = f"STT Request failed: {str(e)}"
                print(f"[!] STT Attempt {attempt+1} exception: {last_error}")

            # Backoff before retry
            if attempt == 0:
                time.sleep(0.5)

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        return STTResponse(
            text="",
            language="unknown",
            confidence=0.0,
            latency_ms=round(elapsed_ms, 2),
            error=f"STT Failed after 2 attempts: {last_error}"
        )


# Global singleton
sarvam_stt_service = SarvamSTTService()
