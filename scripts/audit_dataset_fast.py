"""
Fast, Streamlined MSMARCO-XI Dataset & Index Auditor across 14 Indic Languages.
Prints immediate progress with flush=True and generates a complete audit breakdown.
"""

import os
import sys
import json
import time
from collections import Counter
from typing import Dict, Any, List
import pyarrow.parquet as pq
from huggingface_hub import hf_hub_download

# Ensure root workspace directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# UTF-8 stdout for Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

INDIC_LANG_MAP = {
    "as": ("Assamese", "validation/asmval.parquet"),
    "bn": ("Bengali", "validation/benval.parquet"),
    "gu": ("Gujarati", "validation/gujval.parquet"),
    "hi": ("Hindi", "validation/hinval.parquet"),
    "kn": ("Kannada", "validation/kanval.parquet"),
    "ml": ("Malayalam", "validation/malval.parquet"),
    "mr": ("Marathi", "validation/marval.parquet"),
    "ne": ("Nepali", "validation/nepval.parquet"),
    "or": ("Odia", "validation/orival.parquet"),
    "pa": ("Punjabi", "validation/panval.parquet"),
    "sa": ("Sanskrit", "validation/sanval.parquet"),
    "ta": ("Tamil", "validation/tamval.parquet"),
    "te": ("Telugu", "validation/telval.parquet"),
    "ur": ("Urdu", "validation/urdval.parquet"),
}


def audit_bm25_index():
    print("\n" + "="*75, flush=True)
    print("TASK 1 AUDIT: EXISTING BM25 INDEX & RETRIEVAL CORPUS", flush=True)
    print("="*75, flush=True)
    
    bm25_path = "data/bm25_index.pkl"
    if os.path.exists(bm25_path):
        import pickle
        with open(bm25_path, "rb") as f:
            data = pickle.load(f)
            chunks = data.get("chunks", [])
            print(f"[*] Total BM25 Chunks: {len(chunks)}", flush=True)
            lang_counts = Counter(c.get("language", "unknown") for c in chunks)
            print(f"[*] Language Distribution in BM25 Index:", flush=True)
            for lang, count in sorted(lang_counts.items()):
                print(f"    - {lang.upper()}: {count} passages", flush=True)
            
            if chunks:
                sample = chunks[0]
                print(f"\n[*] Sample Chunk Structure:", flush=True)
                print(f"    - chunk_id: {sample.get('chunk_id')}", flush=True)
                print(f"    - language: {sample.get('language')}", flush=True)
                print(f"    - metadata: {sample.get('metadata')}", flush=True)
                print(f"    - text (first 100 chars): {sample.get('text', '')[:100]}...", flush=True)
    else:
        print("[!] No BM25 index found at data/bm25_index.pkl", flush=True)


def audit_language_shard(repo_id: str, filename: str, lang_code: str, lang_name: str) -> Dict[str, Any]:
    print(f"\n[*] Downloading & Auditing {lang_name} ({lang_code}) from {filename}...", flush=True)
    t0 = time.time()
    try:
        local_path = hf_hub_download(repo_id=repo_id, filename=filename, repo_type="dataset")
    except Exception as e:
        print(f"[!] Error downloading {filename}: {e}", flush=True)
        return {"language": lang_name, "lang_code": lang_code, "error": str(e)}

    parquet_file = pq.ParquetFile(local_path)
    total_rows = parquet_file.metadata.num_rows

    total_queries = 0
    total_passages = 0
    selected_passages = 0
    empty_queries = 0
    empty_passages = 0
    duplicate_query_ids = 0
    duplicate_passages = 0
    malformed_records = 0
    passage_lengths = []

    seen_qids = set()
    seen_passages = set()

    for batch in parquet_file.iter_batches(batch_size=2000):
        df_batch = batch.to_pylist()
        for row in df_batch:
            total_queries += 1
            qid = row.get("query_id")
            if qid in seen_qids:
                duplicate_query_ids += 1
            else:
                seen_qids.add(qid)

            query = row.get("query", "")
            if not query or not query.strip():
                empty_queries += 1

            passages_obj = row.get("passages", {})
            if not isinstance(passages_obj, dict):
                malformed_records += 1
                continue

            tr_passages = passages_obj.get("Translated_passages", [])
            en_passages = passages_obj.get("English_passages", [])
            is_selected = passages_obj.get("is_selected", [])

            if not tr_passages or not isinstance(tr_passages, list):
                malformed_records += 1
                continue

            for idx, p_text in enumerate(tr_passages):
                total_passages += 1
                if not p_text or not p_text.strip():
                    empty_passages += 1
                    continue

                words = len(p_text.split())
                passage_lengths.append(words)

                p_hash = hash(p_text.strip())
                if p_hash in seen_passages:
                    duplicate_passages += 1
                else:
                    seen_passages.add(p_hash)

                sel = is_selected[idx] if idx < len(is_selected) else 0
                if sel == 1:
                    selected_passages += 1

    avg_len = sum(passage_lengths) / len(passage_lengths) if passage_lengths else 0
    max_len = max(passage_lengths) if passage_lengths else 0
    min_len = min(passage_lengths) if passage_lengths else 0
    dur = time.time() - t0

    result = {
        "language": lang_name,
        "lang_code": lang_code,
        "filename": filename,
        "total_rows": total_rows,
        "total_queries": total_queries,
        "total_passages": total_passages,
        "selected_passages": selected_passages,
        "empty_queries": empty_queries,
        "empty_passages": empty_passages,
        "duplicate_query_ids": duplicate_query_ids,
        "duplicate_passages": duplicate_passages,
        "malformed_records": malformed_records,
        "avg_words_per_passage": round(avg_len, 1),
        "min_words": min_len,
        "max_words": max_len,
        "audit_duration_sec": round(dur, 2)
    }

    print(f"    ✓ {lang_name} Audited ({dur:.1f}s): {total_queries} queries, {total_passages} passages ({selected_passages} selected), avg length {avg_len:.1f} words", flush=True)
    return result


def main():
    audit_bm25_index()

    print("\n" + "="*75, flush=True)
    print("TASK 2 AUDIT: DATASET VERIFICATION ACROSS ALL 14 INDIC LANGUAGES", flush=True)
    print("Dataset: ai4bharat/MSMARCO-XI", flush=True)
    print("="*75, flush=True)

    repo_id = "ai4bharat/MSMARCO-XI"
    all_results = []

    for lang_code, (lang_name, val_file) in INDIC_LANG_MAP.items():
        res = audit_language_shard(repo_id, val_file, lang_code, lang_name)
        all_results.append(res)

    os.makedirs("reports", exist_ok=True)
    report_file = "reports/dataset_verification_audit.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print(f"\n[✓] Saved complete dataset audit report to {report_file}", flush=True)


if __name__ == "__main__":
    main()
