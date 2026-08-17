import os
import json
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.stdout.reconfigure(encoding="utf-8")

from backend.translation import translate_ui_keys
from backend.languages import DATASET_LANGUAGE_MAP

LOCALES_DIR = PROJECT_ROOT / "frontend" / "locales"


def process_language(lang_code, en_dict):
    target_file = LOCALES_DIR / f"{lang_code}.json"
    if target_file.exists() and target_file.stat().st_size > 8000:
        print(f"[=] {lang_code}.json already exists and valid ({target_file.stat().st_size} bytes)")
        return lang_code

    lang_info = DATASET_LANGUAGE_MAP.get(lang_code, {})
    lang_name = lang_info.get("name", lang_code)
    print(f"[*] Translating {lang_code} ({lang_name})...")
    translated = translate_ui_keys(en_dict, target_lang=lang_code, source_lang="en")

    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(translated, f, ensure_ascii=False, indent=2)

    print(f"[+] Saved {lang_code}.json ({len(translated)} keys)")
    return lang_code


def main():
    en_file = LOCALES_DIR / "en.json"
    with open(en_file, "r", encoding="utf-8") as f:
        en_dict = json.load(f)

    all_langs = ["as", "bn", "gu", "hi", "kn", "ml", "mr", "ne", "or", "pa", "sa", "ta", "te", "ur"]

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(process_language, code, en_dict) for code in all_langs]
        for f in futures:
            f.result()

    print("[🎉] All 15 languages finished processing!")


if __name__ == "__main__":
    main()
