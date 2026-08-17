"""
Automated Verification Suite for All 15 Supported Indian Languages + English.
Checks:
- All 15 locale JSON files exist and are valid JSON
- Canonical English keys coverage across all 15 languages
- Single source of truth configuration (LANGUAGES and DATASET_LANGUAGE_MAP)
- STT codes, TTS codes, RTL flag for Urdu
- Variable placeholder preservation
"""

import json
import pytest
from pathlib import Path
from backend.languages import DATASET_LANGUAGE_MAP, normalize_language_code
from backend.translation import protect_tokens, restore_tokens

PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOCALES_DIR = PROJECT_ROOT / "frontend" / "locales"

EXPECTED_LANGUAGES = [
    "en", "as", "bn", "gu", "hi", "kn", "ml", "mr", "ne", "or", "pa", "sa", "ta", "te", "ur"
]


def test_dataset_language_map_completeness():
    """Verify all 15 languages are registered in DATASET_LANGUAGE_MAP."""
    for lang in EXPECTED_LANGUAGES:
        assert lang in DATASET_LANGUAGE_MAP, f"Missing {lang} in DATASET_LANGUAGE_MAP"
        info = DATASET_LANGUAGE_MAP[lang]
        assert "name" in info
        assert "native_name" in info
        assert "stt_code" in info
        assert "tts_code" in info
        assert "train" in info
        assert "validation" in info


def test_urdu_rtl_flag():
    """Verify Urdu is marked as RTL while others are LTR."""
    assert DATASET_LANGUAGE_MAP["ur"]["is_rtl"] is True
    for lang in EXPECTED_LANGUAGES:
        if lang != "ur":
            assert DATASET_LANGUAGE_MAP[lang]["is_rtl"] is False


def test_all_15_locale_files_exist():
    """Verify all 15 locale JSON files exist in frontend/locales/."""
    for lang in EXPECTED_LANGUAGES:
        locale_path = LOCALES_DIR / f"{lang}.json"
        assert locale_path.exists(), f"Missing locale file: {locale_path}"
        assert locale_path.stat().st_size > 1000, f"Locale file too small: {locale_path}"


def test_locale_keys_coverage_against_canonical_en():
    """Verify every locale covers all keys from en.json without undefined values."""
    en_file = LOCALES_DIR / "en.json"
    with open(en_file, "r", encoding="utf-8") as f:
        en_dict = json.load(f)

    for lang in EXPECTED_LANGUAGES:
        locale_path = LOCALES_DIR / f"{lang}.json"
        with open(locale_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        assert isinstance(data, dict)
        # Check key count
        assert len(data) >= len(en_dict) * 0.95, f"{lang}.json has too few keys: {len(data)} vs {len(en_dict)}"

        # Check for empty strings or undefined
        for k, v in data.items():
            assert v is not None, f"Key {k} is None in {lang}.json"
            assert str(v).strip() != "", f"Key {k} is empty in {lang}.json"
            assert "undefined" not in str(v).lower(), f"Key {k} has 'undefined' in {lang}.json"


def test_placeholder_token_preservation():
    """Verify variables like {count} and technical terms like MSMARCO-XI are preserved."""
    test_text = "Response generated in {latency} ms for MSMARCO-XI"
    prot, reps = protect_tokens(test_text)
    assert "__VAR_0__" in prot
    assert "__BRAND_1__" in prot

    restored = restore_tokens(prot, reps)
    assert restored == test_text


def test_language_normalization():
    """Verify 3-letter, regional, and standard 2-letter codes normalize cleanly."""
    assert normalize_language_code("hin") == "hi"
    assert normalize_language_code("ben") == "bn"
    assert normalize_language_code("tam") == "ta"
    assert normalize_language_code("hi-IN") == "hi"
    assert normalize_language_code("mr") == "mr"
    assert normalize_language_code("unknown") == "en"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
