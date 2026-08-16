"""
Multi-Language Ingestion Pipeline for AI4Bharat MSMARCO-XI.
Ingests validation shards across all 14 Indian languages into the local Qdrant vector database and BM25 index.

Usage:
  python ingestion/ingest_multilingual.py [records_per_language] [languages]
  
Examples:
  python ingestion/ingest_multilingual.py 200 hi,mr,bn,ta,te,gu
  python ingestion/ingest_multilingual.py 100 all
"""

import os
import sys
import time

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from ingestion.indexer import IngestionPipeline

LANGUAGE_SHARD_MAP = {
    "hi": ("validation/hinval.parquet", "hi"),
    "mr": ("validation/marval.parquet", "mr"),
    "bn": ("validation/benval.parquet", "bn"),
    "ta": ("validation/tamval.parquet", "ta"),
    "te": ("validation/telval.parquet", "te"),
    "gu": ("validation/gujval.parquet", "gu"),
    "kn": ("validation/kanval.parquet", "kn"),
    "ml": ("validation/malval.parquet", "ml"),
    "pa": ("validation/panval.parquet", "pa"),
    "or": ("validation/orival.parquet", "or"),
    "as": ("validation/asmval.parquet", "as"),
    "ur": ("validation/urdval.parquet", "ur"),
    "sa": ("validation/sanval.parquet", "sa"),
    "ne": ("validation/nepval.parquet", "ne")
}


def run_multilingual_ingestion(records_per_lang: int = 200, languages: str = "hi,mr,bn,ta,te,gu"):
    start_total = time.time()
    
    if languages == "all":
        selected_langs = list(LANGUAGE_SHARD_MAP.keys())
    else:
        selected_langs = [l.strip() for l in languages.split(",") if l.strip() in LANGUAGE_SHARD_MAP]

    print(f"\n========================================================")
    print(f"[*] Starting Multilingual MSMARCO-XI Ingestion")
    print(f"[*] Selected Languages ({len(selected_langs)}): {', '.join(selected_langs)}")
    print(f"[*] Records Per Language: {records_per_lang}")
    print(f"[*] Dataset: ai4bharat/MSMARCO-XI")
    print(f"========================================================\n")

    for idx, lang_code in enumerate(selected_langs, start=1):
        file_path, target_lang = LANGUAGE_SHARD_MAP[lang_code]
        print(f"\n[{idx}/{len(selected_langs)}] Ingesting {target_lang.upper()} from {file_path} ({records_per_lang} records)...")
        try:
            pipeline = IngestionPipeline(
                dataset_name="ai4bharat/MSMARCO-XI",
                data_file=file_path,
                target_lang=target_lang,
                checkpoint_file=f"data/checkpoint_{target_lang}.json"
            )
            pipeline.run(max_records=records_per_lang, batch_size=64, resume=False)
            print(f"[+] Completed ingestion for {target_lang.upper()}.")
        except Exception as e:
            print(f"[!] Error ingesting {target_lang.upper()} ({file_path}): {e}")

    total_time = round(time.time() - start_total, 2)
    print(f"\n[✓] Finished all multilingual ingestions in {total_time}s.")


if __name__ == "__main__":
    records = 200
    langs = "hi,mr,bn,ta,te,gu"
    if len(sys.argv) > 1:
        records = int(sys.argv[1])
    if len(sys.argv) > 2:
        langs = sys.argv[2]

    run_multilingual_ingestion(records_per_lang=records, languages=langs)
