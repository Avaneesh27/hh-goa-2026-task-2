"""
Backend Translation Service for Localizing UI Strings and preserving technical tokens/placeholders.
Uses Google Translator securely on the backend without exposing API keys to the frontend.
"""

import re
from typing import Dict, Any, List
from deep_translator import GoogleTranslator
from backend.languages import normalize_language_code, DATASET_LANGUAGE_MAP


def protect_tokens(text: str) -> tuple[str, Dict[str, str]]:
    """Protects template placeholders (e.g. {count}, {{latency}}) and technical brand names from translation."""
    replacements = {}
    counter = 0

    # 1. Protect curly brace variables like {var} or {{var}}
    def var_sub(match):
        nonlocal counter
        placeholder = f"__VAR_{counter}__"
        replacements[placeholder] = match.group(0)
        counter += 1
        return placeholder

    protected_text = re.sub(r"\{\{?[\w\.]+\}\}?", var_sub, text)

    # 2. Protect exact technical brand terms that should remain recognized
    tech_terms = ["MSMARCO-XI", "AI4Bharat", "Qdrant", "BM25", "Sarvam", "STT", "TTS", "RAG", "RRF", "PCM", "HNSW"]
    for term in tech_terms:
        if term in protected_text:
            placeholder = f"__BRAND_{counter}__"
            replacements[placeholder] = term
            protected_text = protected_text.replace(term, placeholder)
            counter += 1

    return protected_text, replacements


def restore_tokens(text: str, replacements: Dict[str, str]) -> str:
    """Restores protected variables and technical brand names into translated text."""
    restored = text
    for placeholder, original in replacements.items():
        restored = restored.replace(placeholder, original)
        # Also catch space-split cases e.g. "__ VAR_0 __"
        spaced = " ".join(list(placeholder))
        restored = restored.replace(spaced, original)
    return restored


from concurrent.futures import ThreadPoolExecutor


def _translate_worker(args: tuple[str, str, str, str]) -> tuple[str, str]:
    key, english_str, source_lang, google_lang = args
    if not english_str or not english_str.strip():
        return key, english_str
    try:
        translator = GoogleTranslator(source=source_lang, target=google_lang)
        protected_text, replacements = protect_tokens(english_str)
        raw_translated = translator.translate(protected_text)
        restored = restore_tokens(raw_translated, replacements)
        return key, restored
    except Exception:
        return key, english_str


def translate_ui_keys(keys_dict: Dict[str, str], target_lang: str, source_lang: str = "en") -> Dict[str, str]:
    """
    Translates a dictionary of UI keys from English into target language,
    preserving all variable placeholders and technical tokens with genuine parallel execution.
    """
    target = normalize_language_code(target_lang)
    if target == "en":
        return keys_dict

    google_lang = DATASET_LANGUAGE_MAP.get(target, {}).get("google_code", target)
    tasks = [(k, v, source_lang, google_lang) for k, v in keys_dict.items()]

    translated_result = {}
    with ThreadPoolExecutor(max_workers=16) as executor:
        results = list(executor.map(_translate_worker, tasks))
        for key, text in results:
            translated_result[key] = text

    return translated_result



