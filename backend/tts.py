"""
Sarvam Text-to-Speech (TTS) Integration Service.
Handles calling the Sarvam Text-to-Speech API (supporting 11 languages
using Bulbul v3 model), error handling, and language normalization.
"""

import time
from typing import Optional, Tuple, Dict, Any
import httpx

from backend.config import settings

# Bulbul v3 supports 11 languages. Map standard 2-letter codes to Sarvam language_code
SARVAM_TTS_LANG_MAP = {
    "hi": "hi-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "mr": "mr-IN",
    "or": "or-IN",
    "pa": "pa-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "en": "en-IN",
    # Hinglish & fallbacks
    "hinglish": "hi-IN",
}


class SarvamTTSService:
    SARVAM_API_URL = "https://api.sarvam.ai/text-to-speech"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SARVAM_API_KEY
        self.timeout_seconds = 15.0

    async def text_to_speech(
        self,
        text: str,
        language_code: str,
        speaker: str = "shubh",
        model: str = "bulbul:v3"
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Calls the Sarvam AI Text-to-Speech API.
        Returns:
            Tuple[Optional[str], Optional[str]]: (base64_audio_string, error_message)
        """
        if not self.api_key or self.api_key == "your_sarvam_api_key_here":
            return None, "SARVAM_API_KEY is not configured in backend .env"

        if not text or not text.strip():
            return None, "Input text to synthesize cannot be empty."

        # Normalize language
        norm_lang = language_code.lower().strip()
        sarvam_lang = SARVAM_TTS_LANG_MAP.get(norm_lang)

        # Fallback handling: if regional code is passed directly e.g. "hi-IN", accept it if it's supported
        if not sarvam_lang:
            if norm_lang in SARVAM_TTS_LANG_MAP.values():
                sarvam_lang = norm_lang
            else:
                # If not supported, return error message so the client knows to trigger browser SpeechSynthesis fallback
                return None, f"Language '{language_code}' is not supported by Sarvam TTS."

        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }

        payload = {
            "text": text,
            "language_code": sarvam_lang,
            "speaker": speaker,
            "model": model
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.post(
                    self.SARVAM_API_URL,
                    headers=headers,
                    json=payload
                )

                if resp.status_code == 200:
                    res_json = resp.json()
                    audios = res_json.get("audios", [])
                    if audios and len(audios) > 0:
                        return audios[0], None
                    return None, "Sarvam TTS API returned success but no audio array was found."
                else:
                    return None, f"Sarvam TTS API returned HTTP {resp.status_code}: {resp.text}"
        except Exception as e:
            return None, f"Sarvam TTS request exception: {str(e)}"


# Global singleton
sarvam_tts_service = SarvamTTSService()
