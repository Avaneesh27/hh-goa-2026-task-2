"""
Comprehensive Audit and Verification Script for MSMARCO-XI Dataset & Existing RAG Index.
1. Audits existing Qdrant vector collection & BM25 index.
2. Audits dataset structure across all 14 Indic languages from ai4bharat/MSMARCO-XI.
3. Reports data integrity, field preservation, empty/duplicate records, and passage length distributions.
"""

import os
import sys
import json
import time
from collections import Counter, defaultdict
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

from backend.config import settings
from backend.retrieval import hybrid_retriever

INDIC_LANG_MAP = {
    "as": ("Assamese", "validation/asmval.parquet", "train/asmtrain.parquet"),
    "bn": ("Bengali", "validation/benval.parquet", "train/bentrain.parquet"),
    "gu": ("Gujarati", "validation/gujval.parquet", "train/gujtrain.parquet"),
    "hi": ("Hindi", "validation/hinval.parquet", "train/hintrain.parquet"),
    "kn": ("Kannada", "validation/kanval.parquet", "train/kantrain.parquet"),
    "ml": ("Malayalam", "validation/malval.parquet", "train/maltrain.parquet"),
    "mr": ("Marathi", "validation/marval.parquet", "train/martrain.parquet"),
    "ne": ("Nepali", "validation/nepval.parquet", "train/neptrain.parquet"),
    "or": ("Odia", "validation/orival.parquet", "train/oritrain.parquet"),
    "pa": ("Punjabi", "validation/panval.parquet", "train/pantrain.parquet"),
    "sa": ("Sanskrit", "validation/sanval.parquet", "train/santrain.parquet"),
    "ta": ("Tamil", "validation/tamval.parquet", "train/tamtrain.parquet"),
    "te": ("Telugu", "validation/telval.parquet", "train/teltrain.parquet"),
    "ur": ("Urdu", "validation/urdval.parquet", "train/urdtrain.parquet"),
}


def audit_existing_rag_index():
    print("\n" + "="*70)
    print("TASK 1: AUDIT OF EXISTING RAG INDEX & STORAGE")
    print("="*70)

    # 1. Audit Qdrant Vector Store
    try:
        client = hybrid_retriever.vector_store.get_client()
        coll_info = client.get_collection(settings.QDRANT_COLLECTION)
        print(f"[*] Qdrant Collection Name: {settings.QDRANT_COLLECTION}")
        print(f"[*] Qdrant Points Count: {coll_info.points_count}")
        print(f"[*] Embedding Dimension: {coll_info.config.params.vectors.size}")
        print(f"[*] Distance Metric: {coll_info.config.params.vectors.distance}")
        
        # Sample points to inspect payload metadata
        sample_pts, _ = client.scroll(
            collection_name=settings.QDRANT_COLLECTION,
            limit=50,
            with_payload=True,
            with_vectors=False
        )
        if sample_pts:
            lang_counts = Counter(pt.payload.get("language", "unknown") for pt in sample_pts)
            fields_present = set(sample_pts[0].payload.keys()) if sample_pts[0].payload else set()
            print(f"[*] Sampled Languages in Qdrant: {dict(lang_counts)}")
            print(f"[*] Payload Fields in Qdrant: {sorted(list(fields_present))}")
            print(f"[*] Sample Payload: {json.dumps(sample_pts[0].payload, ensure_ascii=False, indent=2)}")
    except Exception as e:
        print(f"[!] Error auditing Qdrant: {e}")

    # 2. Audit BM25 Index
    bm25_engine = hybrid_retriever.bm25_engine
    if bm25_engine and bm25_engine.corpus_chunks:
        print(f"\n[*] BM25 Total Chunks: {len(bm25_engine.corpus_chunks)}")
        lang_counts_bm25 = Counter(c.get("language", "unknown") for c in bm25_engine.corpus_chunks)
        print(f"[*] BM25 Language Distribution: {dict(lang_counts_bm25)}")
        if bm25_engine.corpus_chunks:
            sample_chunk = bm25_engine.corpus_chunks[0]
            print(f"[*] Sample BM25 Chunk Keys: {list(sample_chunk.keys())}")
    else:
        print("[!] BM25 Index is empty or not loaded.")

    # 3. Model Audit
    print(f"\n[*] Embedding Model in Config: {settings.EMBEDDING_MODEL}")
    print(f"[*] Reranker Model in Config: {settings.RERANKER_MODEL}")
    print(f"[*] LLM Provider in Config: {settings.LLM_PROVIDER}")


def audit_parquet_shard(repo_id: str, filename: str, lang_code: str, lang_name: str, split_type: str) -> Dict[str, Any]:
    try:
        local_path = hf_hub_download(repo_id=repo_id, filename=filename, repo_type="dataset")
    except Exception as e:
        return {"error": str(e), "filename": filename}

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

    for batch in parquet_file.iter_batches(batch_size=1000):
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

    return {
        "language": lang_name,
        "lang_code": lang_code,
        "split": split_type,
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
        "max_words": max_len
    }


def audit_all_languages():
    print("\n" + "="*70)
    print("TASK 2: COMPREHENSIVE DATASET VERIFICATION ACROSS ALL 14 INDIC LANGUAGES")
    print("Dataset: ai4bharat/MSMARCO-XI")
    print("="*70)

    results = []
    repo_id = "ai4bharat/MSMARCO-XI"

    for lang_code, (lang_name, val_file, train_file) in INDIC_LANG_MAP.items():
        print(f"\n[*] Auditing {lang_name} ({lang_code})...")
        val_stats = audit_parquet_shard(repo_id, val_file, lang_code, lang_name, "validation")
        results.append(val_stats)

        print(f"  [{lang_name} - Validation]")
        print(f"    Total Queries/Rows: {val_stats.get('total_queries')}")
        print(f"    Total Passages: {val_stats.get('total_passages')}")
        print(f"    Selected Ground-Truth Passages: {val_stats.get('selected_passages')}")
        print(f"    Empty Queries: {val_stats.get('empty_queries')}")
        print(f"    Empty Passages: {val_stats.get('empty_passages')}")
        print(f"    Duplicate Query IDs: {val_stats.get('duplicate_query_ids')}")
        print(f"    Duplicate Passages: {val_stats.get('duplicate_passages')}")
        print(f"    Avg Words / Passage: {val_stats.get('avg_words_per_passage')} (Min: {val_stats.get('min_words')}, Max: {val_stats.get('max_words')})")

    # Save verification report
    os.makedirs("reports", exist_ok=True)
    report_path = "reports/dataset_verification_audit.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n[✓] Saved complete dataset verification audit report to {report_path}")


if __name__ == "__main__":
    audit_existing_rag_index()
    audit_all_languages()
