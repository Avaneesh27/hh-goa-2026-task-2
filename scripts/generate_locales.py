"""
Translation Generation Utility.
Reads frontend/locales/en.json, translates canonical UI strings into all 14 target Indian languages
via backend translation engine with placeholder & technical brand token protection, and writes
all 15 locale files to frontend/locales/{code}.json.
"""

import os
import json
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.stdout.reconfigure(encoding="utf-8")

from backend.translation import translate_ui_keys
from backend.languages import DATASET_LANGUAGE_MAP

LOCALES_DIR = PROJECT_ROOT / "frontend" / "locales"


def generate_all_locales():
    en_file = LOCALES_DIR / "en.json"
    if not en_file.exists():
        print(f"[-] Error: {en_file} does not exist.")
        sys.exit(1)

    with open(en_file, "r", encoding="utf-8") as f:
        en_dict = json.load(f)

    print(f"[*] Loaded canonical en.json ({len(en_dict)} keys)")

    # All 15 languages
    languages_to_generate = [
        "as", "bn", "gu", "hi", "kn", "ml", "mr", "ne", "or", "pa", "sa", "ta", "te", "ur"
    ]

    for lang_code in languages_to_generate:
        lang_info = DATASET_LANGUAGE_MAP.get(lang_code, {})
        lang_name = lang_info.get("name", lang_code)
        native_name = lang_info.get("native_name", "")
        print(f"[*] Generating translations for {lang_code} ({lang_name} - {native_name})...")

        target_file = LOCALES_DIR / f"{lang_code}.json"
        
        # Translate keys
        translated = translate_ui_keys(en_dict, target_lang=lang_code, source_lang="en")

        # Write to JSON file
        with open(target_file, "w", encoding="utf-8") as f:
            json.dump(translated, f, ensure_ascii=False, indent=2)

        print(f"[+] Saved {target_file.name} ({len(translated)} keys)")

    print("[🎉] All 15 locale JSON files generated successfully!")


if __name__ == "__main__":
    generate_all_locales()
