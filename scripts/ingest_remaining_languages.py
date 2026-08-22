"""
Dedicated Ingestion Engine for Remaining Indic Languages (50,000 rows per language).
Streams and indexes:
  - Kannada (kn)
  - Malayalam (ml)
  - Punjabi (pa)
  - Odia (or)
  - Assamese (as)
  - Urdu (ur)
  - Sanskrit (sa)
  - Nepali (ne)
into high-speed FAISS vector stores & SQLite payload databases with CUDA GPU acceleration.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import pyarrow.parquet as pq
from huggingface_hub import hf_hub_download
import torch

from backend.config import settings
from backend.embeddings import embedding_manager
from backend.retrieval import BM25SearchEngine, faiss_vector_store
from ingestion.cleaner import TextCleaner
from ingestion.chunker import AdaptiveChunker

REMAINING_SHARDS = [
    ("validation/gujval.parquet", "gu", "Gujarati"),
    ("validation/kanval.parquet", "kn", "Kannada"),
    ("validation/malval.parquet", "ml", "Malayalam"),
    ("validation/panval.parquet", "pa", "Punjabi"),
    ("validation/orival.parquet", "or", "Odia"),
    ("validation/asmval.parquet", "as", "Assamese"),
    ("validation/urdval.parquet", "ur", "Urdu"),
    ("validation/sanval.parquet", "sa", "Sanskrit"),
    ("validation/nepval.parquet", "ne", "Nepali"),
]

CHECKPOINT_DIR = PROJECT_ROOT / "checkpoints"


class RemainingLanguagesIngestionEngine:
    def __init__(self, batch_size: int = 256, embed_batch_size: int = 256):
        self.batch_size = batch_size
        self.embed_batch_size = embed_batch_size
        self.cleaner = TextCleaner()
        self.chunker = AdaptiveChunker()
        self.bm25_engine = BM25SearchEngine()
        CHECKPOINT_DIR.mkdir(exist_ok=True)

    def save_checkpoint(self, shard_name: str, last_row: int, total_chunks: int, status: str = "in_progress"):
        safe_name = shard_name.replace("/", "_").replace(".parquet", "")
        chk_file = CHECKPOINT_DIR / f"{safe_name}.json"
        with open(chk_file, "w", encoding="utf-8") as f:
            json.dump({
                "shard": shard_name,
                "last_row": last_row,
                "total_chunks": total_chunks,
                "status": status,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
            }, f, indent=2)

    def ingest_shard(
        self,
        shard_path: str,
        lang_code: str,
        lang_name: str,
        limit_rows: int = 50000
    ) -> Dict[str, Any]:
        print(f"\n{'='*75}")
        print(f"🚀 INGESTING {lang_name.upper()} ({lang_code}) | Target: {limit_rows:,} rows")
        print(f"{'='*75}")

        try:
            local_file = hf_hub_download(
                repo_id="ai4bharat/MSMARCO-XI",
                filename=shard_path,
                repo_type="dataset"
            )
            parquet_file = pq.ParquetFile(local_file)
        except Exception:
            print(f"[!] Re-downloading {shard_path} due to download exception...", flush=True)
            local_file = hf_hub_download(
                repo_id="ai4bharat/MSMARCO-XI",
                filename=shard_path,
                repo_type="dataset",
                force_download=True
            )
            parquet_file = pq.ParquetFile(local_file)

        total_rows_in_shard = parquet_file.metadata.num_rows
        target_rows = min(total_rows_in_shard, limit_rows)
        print(f"[*] Total Rows in Shard: {total_rows_in_shard:,} | Ingesting: {target_rows:,} rows")

        safe_name = shard_path.replace("/", "_").replace(".parquet", "")
        chk_file = CHECKPOINT_DIR / f"{safe_name}.json"
        
        last_checkpoint_row = 0
        total_chunks_indexed = 0
        if chk_file.exists():
            try:
                with open(chk_file, "r", encoding="utf-8") as f:
                    cdata = json.load(f)
                    c_status = cdata.get("status", "")
                    c_rows = cdata.get("last_row", 0)
                    c_chunks = cdata.get("total_chunks", 0)
                    if c_status == "completed" and c_rows >= target_rows:
                        print(f"[✓] {lang_name} ({lang_code}) is already completed ({c_rows:,} rows, {c_chunks:,} chunks). Skipping.\n", flush=True)
                        return {
                            "lang": lang_code,
                            "name": lang_name,
                            "rows": c_rows,
                            "chunks": c_chunks,
                            "time_sec": 0
                        }
                    elif c_rows > 1000 and c_status == "in_progress":
                        last_checkpoint_row = c_rows
                        total_chunks_indexed = c_chunks
                        print(f"[*] Resuming {lang_name} from row {last_checkpoint_row:,} ({total_chunks_indexed:,} chunks already indexed).", flush=True)
            except Exception as e:
                print(f"[!] Warning reading checkpoint: {e}", flush=True)

        # Clear old stub SQLite/FAISS for clean build if < 1000 rows
        db_file = PROJECT_ROOT / "data" / f"payloads_{lang_code}.sqlite"
        idx_file = PROJECT_ROOT / "data" / f"faiss_{lang_code}.index"
        
        if last_checkpoint_row <= 1000:
            if db_file.exists():
                try:
                    db_file.unlink()
                except Exception:
                    pass
            if idx_file.exists():
                try:
                    idx_file.unlink()
                except Exception:
                    pass
            if lang_code in faiss_vector_store._indices:
                del faiss_vector_store._indices[lang_code]
            if lang_code in faiss_vector_store._connections:
                del faiss_vector_store._connections[lang_code]
            total_chunks_indexed = 0

        shard_start_time = time.perf_counter()
        current_row = 0

        for batch in parquet_file.iter_batches(batch_size=self.batch_size):
            batch_len = len(batch)
            batch_start = current_row
            batch_end = current_row + batch_len
            current_row = batch_end

            if last_checkpoint_row > 0 and batch_end <= last_checkpoint_row:
                continue

            pydict = batch.to_pydict()
            records_count = len(pydict["query_id"])
            batch_records = []

            for i in range(records_count):
                global_row = batch_start + i
                if global_row < last_checkpoint_row:
                    continue
                if global_row >= target_rows:
                    break

                rec = {
                    "query_id": pydict["query_id"][i],
                    "query_type": pydict["query_type"][i] if "query_type" in pydict else "UNKNOWN",
                    "query": pydict["query"][i],
                    "Eng_Query": pydict["Eng_Query"][i] if "Eng_Query" in pydict else "",
                    "Answer": pydict["Answer"][i] if "Answer" in pydict else "",
                    "Eng_Answer": pydict["Eng_Answer"][i] if "Eng_Answer" in pydict else "",
                    "source_lang": pydict["source_lang"][i] if "source_lang" in pydict else "eng_Latn",
                    "target_lang": pydict["target_lang"][i] if "target_lang" in pydict else lang_code,
                    "passages": pydict["passages"][i] if "passages" in pydict else {}
                }
                batch_records.append(rec)

            if not batch_records:
                if current_row >= target_rows:
                    break
                continue

            # 1. Clean and Chunk
            cleaned_docs, _ = self.cleaner.clean_batch(batch_records, target_lang=lang_code)
            batch_chunks = []
            for doc in cleaned_docs:
                atomic_chunks = self.chunker.chunk_atomic_passage(doc)
                batch_chunks.extend(atomic_chunks)

            # 2. Deduplicate
            seen_texts = set()
            unique_batch_chunks = []
            for c in batch_chunks:
                t_hash = hash(c["text"])
                if t_hash not in seen_texts:
                    seen_texts.add(t_hash)
                    unique_batch_chunks.append(c)

            # 3. Vectorize and Index on GPU
            if unique_batch_chunks:
                batch_texts = [c["text"] for c in unique_batch_chunks]
                with torch.inference_mode():
                    batch_embeddings = embedding_manager.embed_documents(batch_texts, batch_size=self.embed_batch_size)

                faiss_vector_store.add_chunks(
                    lang_code=lang_code,
                    chunks=unique_batch_chunks,
                    embeddings=batch_embeddings
                )
                total_chunks_indexed += len(unique_batch_chunks)

            processed_so_far = min(current_row, target_rows)
            elapsed = time.perf_counter() - shard_start_time
            rate = processed_so_far / max(elapsed, 0.001)
            eta_sec = (target_rows - processed_so_far) / max(rate, 0.001)

            if processed_so_far % (self.batch_size * 4) == 0 or processed_so_far >= target_rows:
                pct = (processed_so_far / target_rows) * 100.0
                faiss_vector_store.save_index_to_disk(lang_code)
                print(f"  [{lang_code.upper()} - {lang_name}] Ingested: {processed_so_far:,}/{target_rows:,} ({pct:.1f}%) | "
                      f"Chunks: {total_chunks_indexed:,} | Speed: {rate:.1f} rows/s | ETA: {eta_sec/60:.1f}m", flush=True)
                self.save_checkpoint(shard_path, processed_so_far, total_chunks_indexed, status="in_progress")

            if current_row >= target_rows:
                break

        faiss_vector_store.save_index_to_disk(lang_code)
        self.save_checkpoint(shard_path, target_rows, total_chunks_indexed, status="completed")
        total_time = time.perf_counter() - shard_start_time
        print(f"[✓] {lang_name} ({lang_code}) Ingestion Finished: {target_rows:,} rows -> {total_chunks_indexed:,} chunks in {total_time/60:.2f}m ({total_time:.1f}s)", flush=True)

        return {
            "lang": lang_code,
            "name": lang_name,
            "rows": target_rows,
            "chunks": total_chunks_indexed,
            "time_sec": total_time
        }


def main():
    parser = argparse.ArgumentParser(description="Ingest 50k rows for remaining Indic languages")
    parser.add_argument("--limit-per-shard", type=int, default=50000)
    parser.add_argument("--batch-size", type=int, default=256)
    parser.add_argument("--embed-batch-size", type=int, default=256)
    parser.add_argument("--langs", type=str, default="all", help="Comma-separated lang codes (e.g. 'kn,ml') or 'all'")
    args = parser.parse_args()

    selected = REMAINING_SHARDS
    if args.langs != "all":
        req = [l.strip().lower() for l in args.langs.split(",")]
        selected = [s for s in REMAINING_SHARDS if s[1] in req]

    print("==========================================================================")
    print("🚀 TARGETED MULTILINGUAL INGESTION FOR REMAINING LANGUAGES (50K ROWS/LANG)")
    print(f"[*] Languages ({len(selected)}): {[s[1].upper() + ' (' + s[2] + ')' for s in selected]}")
    print(f"[*] Limit Per Language: {args.limit_per_shard:,} rows")
    print(f"[*] GPU Acceleration: {'CUDA (' + torch.cuda.get_device_name(0) + ')' if torch.cuda.is_available() else 'CPU'}")
    print("==========================================================================\n")

    engine = RemainingLanguagesIngestionEngine(
        batch_size=args.batch_size,
        embed_batch_size=args.embed_batch_size
    )

    grand_start = time.perf_counter()
    summary = []

    for idx, (shard_path, lang_code, lang_name) in enumerate(selected, start=1):
        print(f"\n>>> Processing Language [{idx}/{len(selected)}]: {lang_name} ({lang_code.upper()})")
        res = engine.ingest_shard(
            shard_path=shard_path,
            lang_code=lang_code,
            lang_name=lang_name,
            limit_rows=args.limit_per_shard
        )
        summary.append(res)

    grand_time = time.perf_counter() - grand_start
    total_rows = sum(s["rows"] for s in summary)
    total_chunks = sum(s["chunks"] for s in summary)

    print("\n==========================================================================")
    print("🎉 ALL REMAINING LANGUAGES SUCCESSFULLY INGESTED & INDEXED")
    print(f"[*] Total Languages: {len(summary)}")
    print(f"[*] Total Rows Ingested: {total_rows:,}")
    print(f"[*] Total Chunks Indexed: {total_chunks:,}")
    print(f"[*] Total Time: {grand_time/60:.2f} minutes ({grand_time:.1f} seconds)")
    print("==========================================================================")


if __name__ == "__main__":
    main()
