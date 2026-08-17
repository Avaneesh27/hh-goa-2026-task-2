"""
Centralized Multilingual Language & Dataset Configuration for Voice-Enabled RAG.
Defines all 15 supported languages (English + 14 Indian languages), dataset mappings,
STT language codes, and TTS language tags.
"""

from typing import Dict, Any, Optional

DATASET_LANGUAGE_MAP: Dict[str, Dict[str, str]] = {
    "as": {
        "name": "Assamese",
        "native_name": "অসমীয়া",
        "train": "asmtrain.jsonl",
        "validation": "asmval.jsonl",
        "stt_code": "as-IN",
        "tts_code": "as-IN",
        "google_code": "as",
        "is_rtl": False
    },
    "bn": {
        "name": "Bengali",
        "native_name": "বাংলা",
        "train": "bentrain.jsonl",
        "validation": "benval.jsonl",
        "stt_code": "bn-IN",
        "tts_code": "bn-IN",
        "google_code": "bn",
        "is_rtl": False
    },
    "gu": {
        "name": "Gujarati",
        "native_name": "ગુજરાતી",
        "train": "gutrain.jsonl",
        "validation": "guval.jsonl",
        "stt_code": "gu-IN",
        "tts_code": "gu-IN",
        "google_code": "gu",
        "is_rtl": False
    },
    "hi": {
        "name": "Hindi",
        "native_name": "हिन्दी",
        "train": "hintrain.jsonl",
        "validation": "hinval.jsonl",
        "stt_code": "hi-IN",
        "tts_code": "hi-IN",
        "google_code": "hi",
        "is_rtl": False
    },
    "kn": {
        "name": "Kannada",
        "native_name": "ಕನ್ನಡ",
        "train": "kantrain.jsonl",
        "validation": "kanval.jsonl",
        "stt_code": "kn-IN",
        "tts_code": "kn-IN",
        "google_code": "kn",
        "is_rtl": False
    },
    "ml": {
        "name": "Malayalam",
        "native_name": "മലയാളം",
        "train": "maltrain.jsonl",
        "validation": "malval.jsonl",
        "stt_code": "ml-IN",
        "tts_code": "ml-IN",
        "google_code": "ml",
        "is_rtl": False
    },
    "mr": {
        "name": "Marathi",
        "native_name": "मराठी",
        "train": "martrain.jsonl",
        "validation": "marval.jsonl",
        "stt_code": "mr-IN",
        "tts_code": "mr-IN",
        "google_code": "mr",
        "is_rtl": False
    },
    "ne": {
        "name": "Nepali",
        "native_name": "नेपाली",
        "train": "neptrain.jsonl",
        "validation": "nepval.jsonl",
        "stt_code": "ne-NP",
        "tts_code": "ne-NP",
        "google_code": "ne",
        "is_rtl": False
    },
    "or": {
        "name": "Odia",
        "native_name": "ଓଡ଼ିଆ",
        "train": "ortrain.jsonl",
        "validation": "orval.jsonl",
        "stt_code": "or-IN",
        "tts_code": "or-IN",
        "google_code": "or",
        "is_rtl": False
    },
    "pa": {
        "name": "Punjabi",
        "native_name": "ਪੰਜਾਬੀ",
        "train": "pantrain.jsonl",
        "validation": "panval.jsonl",
        "stt_code": "pa-IN",
        "tts_code": "pa-IN",
        "google_code": "pa",
        "is_rtl": False
    },
    "sa": {
        "name": "Sanskrit",
        "native_name": "संस्कृतम्",
        "train": "santrain.jsonl",
        "validation": "sanval.jsonl",
        "stt_code": "sa-IN",
        "tts_code": "sa-IN",
        "google_code": "sa",
        "is_rtl": False
    },
    "ta": {
        "name": "Tamil",
        "native_name": "தமிழ்",
        "train": "tamtrain.jsonl",
        "validation": "tamval.jsonl",
        "stt_code": "ta-IN",
        "tts_code": "ta-IN",
        "google_code": "ta",
        "is_rtl": False
    },
    "te": {
        "name": "Telugu",
        "native_name": "తెలుగు",
        "train": "teltrain.jsonl",
        "validation": "telval.jsonl",
        "stt_code": "te-IN",
        "tts_code": "te-IN",
        "google_code": "te",
        "is_rtl": False
    },
    "ur": {
        "name": "Urdu",
        "native_name": "اردو",
        "train": "urdtrain.jsonl",
        "validation": "urdval.jsonl",
        "stt_code": "ur-IN",
        "tts_code": "ur-IN",
        "google_code": "ur",
        "is_rtl": True
    },
    "en": {
        "name": "English",
        "native_name": "English",
        "train": "msmarco_passage_train.jsonl",
        "validation": "msmarco_passage_val.jsonl",
        "stt_code": "en-IN",
        "tts_code": "en-IN",
        "google_code": "en",
        "is_rtl": False
    }
}


def normalize_language_code(code: Optional[str]) -> str:
    """Normalizes 2-letter, 3-letter, or regional codes to standard 2-letter code."""
    if not code:
        return "en"
    clean = code.strip().lower()
    # 3-letter to 2-letter map
    code_3to2 = {
        "asm": "as", "ben": "bn", "guj": "gu", "hin": "hi", "kan": "kn",
        "mal": "ml", "mar": "mr", "nep": "ne", "ori": "or", "pan": "pa",
        "san": "sa", "tam": "ta", "tel": "te", "urd": "ur", "eng": "en"
    }
    if clean in code_3to2:
        return code_3to2[clean]
    # Regional code e.g. "hi-IN" -> "hi"
    if "-" in clean:
        prefix = clean.split("-")[0]
        if prefix in DATASET_LANGUAGE_MAP:
            return prefix
    if clean in DATASET_LANGUAGE_MAP:
        return clean
    return "en"
