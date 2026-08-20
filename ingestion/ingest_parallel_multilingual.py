"""
Simultaneous Multi-Language Parallel Ingestion & Indexing Engine.
Streams and ingests ALL 14 Indic language shards simultaneously in parallel:
  - Multi-threaded PyArrow streaming & CPU text cleaning across all language shards
  - Unified High-Throughput GPU batch embedding queue (CUDA FP16 Tensor Cores)
  - Language-partitioned asynchronous Qdrant vector storage
  - Real-time parallel multi-language progress dashboard & independent checkpointing
"""

import os
import sys
import time
import json
import uuid
import queue
import threading
import argparse
from typing import List, Dict, Any, Optional
from pathlib import Path

# Add workspace root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import pyarrow.parquet as pq
from huggingface_hub import hf_hub_download
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
import torch

from backend.config import settings
from backend.embeddings import embedding_manager
from backend.retrieval import hybrid_retriever, BM25SearchEngine
from ingestion.cleaner import TextCleaner
from ingestion.chunker import AdaptiveChunker

CHECKPOINT_DIR = PROJECT_ROOT / "checkpoints"
CHECKPOINT_DIR.mkdir(exist_ok=True)

ALL_SHARDS = [
    ("validation/hinval.parquet", "hi", "Hindi"),
    ("validation/marval.parquet", "mr", "Marathi"),
    ("validation/benval.parquet", "bn", "Bengali"),
    ("validation/tamval.parquet", "ta", "Tamil"),
    ("validation/telval.parquet", "te", "Telugu"),
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


class ParallelMultilingualIngestionEngine:
    def __init__(self, embed_batch_size: int = 512, cpu_workers: int = 4):
        self.embed_batch_size = embed_batch_size
        self.cpu_workers = cpu_workers
        self.cleaner = TextCleaner()
        self.chunker = AdaptiveChunker()
        self.bm25_engine = BM25SearchEngine()
        self.vector_store = hybrid_retriever.vector_store
        self.qdrant = self.vector_store.get_client()

        # Thread-safe chunk ingestion queue
        self.chunk_queue = queue.Queue(maxsize=10000)
        self.stop_signal = threading.Event()
        
        # Thread-safe shard progress tracking
        self.progress_lock = threading.Lock()
        self.shard_progress = {}
        for shard_path, lang_code, lang_name in ALL_SHARDS:
            chk = self.get_checkpoint(shard_path)
            self.shard_progress[lang_code] = {
                "shard_path": shard_path,
                "name": lang_name,
                "done_rows": chk.get("last_row", 0),
                "total_rows": 97941,
                "chunks": chk.get("total_chunks", 0),
                "status": chk.get("status", "pending")
            }

        # Initialize collections
        self._ensure_all_collections()

    def _ensure_all_collections(self):
        existing = [c.name for c in self.qdrant.get_collections().collections]
        for _, lang_code, _ in ALL_SHARDS:
            col = settings.QDRANT_COLLECTION if lang_code == "hi" else f"msmarco_{lang_code}"
            if col not in existing:
                print(f"[*] Initializing Qdrant collection: {col} (dim={settings.EMBEDDING_DIM})...", flush=True)
                self.qdrant.create_collection(
                    collection_name=col,
                    vectors_config=qmodels.VectorParams(
                        size=settings.EMBEDDING_DIM,
                        distance=qmodels.Distance.COSINE
                    )
                )

    def get_checkpoint(self, shard_name: str) -> Dict[str, Any]:
        safe_name = shard_name.replace("/", "_").replace(".parquet", "")
        chk_file = CHECKPOINT_DIR / f"{safe_name}.json"
        if chk_file.exists():
            try:
                with open(chk_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"last_row": 0, "total_chunks": 0, "status": "pending"}

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

    def shard_reader_worker(self, shard_path: str, lang_code: str, limit_rows: Optional[int] = None):
        """Reads, cleans, and chunks text from a single language shard in parallel."""
        try:
            local_file = hf_hub_download(repo_id="ai4bharat/MSMARCO-XI", filename=shard_path, repo_type="dataset")
            parquet_file = pq.ParquetFile(local_file)
            total_rows_in_shard = parquet_file.metadata.num_rows
            max_rows = min(total_rows_in_shard, limit_rows) if limit_rows else total_rows_in_shard

            chk = self.get_checkpoint(shard_path)
            start_row = chk.get("last_row", 0)

            with self.progress_lock:
                self.shard_progress[lang_code]["total_rows"] = max_rows
                self.shard_progress[lang_code]["done_rows"] = start_row

            if start_row >= max_rows:
                with self.progress_lock:
                    self.shard_progress[lang_code]["status"] = "completed"
                return

            current_row = 0
            for batch in parquet_file.iter_batches(batch_size=128):
                if self.stop_signal.is_set():
                    break

                batch_len = len(batch)
                batch_start = current_row
                batch_end = current_row + batch_len
                current_row = batch_end

                if batch_end <= start_row:
                    continue

                pydict = batch.to_pydict()
                records_count = len(pydict["query_id"])
                batch_records = []

                for i in range(records_count):
                    global_row = batch_start + i
                    if global_row < start_row:
                        continue
                    if global_row >= max_rows:
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
                    if current_row >= max_rows:
                        break
                    continue

                # Clean & chunk in this reader thread
                cleaned_docs, _ = self.cleaner.clean_batch(batch_records, target_lang=lang_code)
                batch_chunks = []
                for doc in cleaned_docs:
                    atomic_chunks = self.chunker.chunk_atomic_passage(doc)
                    batch_chunks.extend(atomic_chunks)

                # Deduplicate
                seen_texts = set()
                unique_batch_chunks = []
                for c in batch_chunks:
                    t_hash = hash(c["text"])
                    if t_hash not in seen_texts:
                        seen_texts.add(t_hash)
                        unique_batch_chunks.append(c)

                # Push to centralized GPU queue
                if unique_batch_chunks:
                    target_col = settings.QDRANT_COLLECTION if lang_code == "hi" else f"msmarco_{lang_code}"
                    self.chunk_queue.put((unique_batch_chunks, target_col, lang_code, min(current_row, max_rows)))

                if current_row >= max_rows:
                    break

            with self.progress_lock:
                self.shard_progress[lang_code]["status"] = "completed"
                self.shard_progress[lang_code]["done_rows"] = max_rows
            self.save_checkpoint(shard_path, max_rows, self.shard_progress[lang_code]["chunks"], status="completed")

        except Exception as e:
            print(f"[!] Error in reader thread for {lang_code}: {e}", flush=True)

    def gpu_indexer_worker(self):
        """Dedicated GPU worker that pulls chunk batches from all languages, computes embeddings, and upserts to Qdrant."""
        print("[*] Dedicated CUDA GPU Embedding & Indexing Worker started.", flush=True)
        active_chunks_buffer = []
        target_cols_buffer = []
        lang_codes_buffer = []
        last_flush_time = time.time()

        while not (self.stop_signal.is_set() and self.chunk_queue.empty()):
            try:
                item = self.chunk_queue.get(timeout=0.5)
                chunks, target_col, lang_code, row_so_far = item
                
                for c in chunks:
                    active_chunks_buffer.append(c)
                    target_cols_buffer.append(target_col)
                    lang_codes_buffer.append(lang_code)

                with self.progress_lock:
                    self.shard_progress[lang_code]["done_rows"] = row_so_far
                self.chunk_queue.task_done()

            except queue.Empty:
                pass

            # Flush when buffer is full or periodically
            if len(active_chunks_buffer) >= self.embed_batch_size or (active_chunks_buffer and time.time() - last_flush_time > 1.0):
                self._flush_gpu_batch(active_chunks_buffer, target_cols_buffer, lang_codes_buffer)
                active_chunks_buffer = []
                target_cols_buffer = []
                lang_codes_buffer = []
                last_flush_time = time.time()

        if active_chunks_buffer:
            self._flush_gpu_batch(active_chunks_buffer, target_cols_buffer, lang_codes_buffer)

    def _flush_gpu_batch(self, chunks: List[Dict[str, Any]], target_cols: List[str], lang_codes: List[str]):
        """Runs vectorized GPU embedding and multi-collection upserts."""
        if not chunks:
            return

        texts = [c["text"] for c in chunks]
        with torch.inference_mode():
            embeddings = embedding_manager.embed_documents(texts, batch_size=self.embed_batch_size)

        # Group by target collection for high-speed multi-collection upserts
        col_points = {}
        for c, emb, col, l_code in zip(chunks, embeddings, target_cols, lang_codes):
            if col not in col_points:
                col_points[col] = []
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, c["chunk_id"]))
            col_points[col].append(
                qmodels.PointStruct(id=point_id, vector=emb.tolist(), payload=c)
            )

        for col, points in col_points.items():
            for u_idx in range(0, len(points), 1000):
                sub_pts = points[u_idx:u_idx + 1000]
                for attempt in range(5):
                    try:
                        self.qdrant.upsert(collection_name=col, points=sub_pts, wait=False)
                        break
                    except Exception as e:
                        if attempt < 4 and "locked" in str(e).lower():
                            time.sleep(0.3 * (2 ** attempt))
                        else:
                            pass

        # Update chunk counts in checkpoints
        lang_counts = {}
        for l_code in lang_codes:
            lang_counts[l_code] = lang_counts.get(l_code, 0) + 1

        with self.progress_lock:
            for l_code, count in lang_counts.items():
                self.shard_progress[l_code]["chunks"] += count
                p = self.shard_progress[l_code]
                self.save_checkpoint(p["shard_path"], p["done_rows"], p["chunks"], status="in_progress")


def main():
    parser = argparse.ArgumentParser(description="Simultaneous Multi-Language Parallel Ingestion")
    parser.add_argument("--embed-batch-size", type=int, default=512)
    parser.add_argument("--limit-per-shard", type=int, default=None)
    args = parser.parse_args()

    print("==========================================================================")
    print("🚀 SIMULTANEOUS MULTI-LANGUAGE PARALLEL INGESTION (ALL 14 LANGUAGES)")
    print(f"[*] Active Shards ({len(ALL_SHARDS)}): {[s[1].upper() for s in ALL_SHARDS]}")
    print(f"[*] GPU Acceleration: CUDA ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")
    print(f"[*] Embedding Batch Size: {args.embed_batch_size} (Vectorized Interleaved Queue)")
    print("==========================================================================\n")

    engine = ParallelMultilingualIngestionEngine(embed_batch_size=args.embed_batch_size)

    # 1. Start GPU indexer worker thread
    gpu_thread = threading.Thread(target=engine.gpu_indexer_worker, daemon=True)
    gpu_thread.start()

    # 2. Start reader threads for all 14 language shards simultaneously
    reader_threads = []
    for shard_path, lang_code, lang_name in ALL_SHARDS:
        t = threading.Thread(
            target=engine.shard_reader_worker,
            args=(shard_path, lang_code, args.limit_per_shard),
            daemon=True
        )
        t.start()
        reader_threads.append(t)

    # 3. Live Dashboard Loop
    start_time = time.time()
    try:
        while True:
            time.sleep(3.0)
            all_done = all(not t.is_alive() for t in reader_threads) and engine.chunk_queue.empty()
            
            with engine.progress_lock:
                total_done = sum(p["done_rows"] for p in engine.shard_progress.values())
                total_target = sum(p["total_rows"] for p in engine.shard_progress.values())
                total_chunks = sum(p["chunks"] for p in engine.shard_progress.values())
                overall_pct = (total_done / total_target * 100.0) if total_target > 0 else 0.0
                elapsed = time.time() - start_time
                rate = total_done / max(elapsed, 0.001)

                active_summary = " | ".join([
                    f"{code.upper()}:{p['done_rows']}/{p['total_rows']}({p['done_rows']/p['total_rows']*100:.0f}%)"
                    for code, p in engine.shard_progress.items() if p["status"] != "completed"
                ][:6])

                print(f"[PARALLEL 14-LANG] Ingested: {total_done:,}/{total_target:,} ({overall_pct:.1f}%) | "
                      f"Total Chunks: {total_chunks:,} | Speed: {rate:.1f} rows/s | Queue: {engine.chunk_queue.qsize()} | {active_summary}", flush=True)

            if all_done:
                break

    except KeyboardInterrupt:
        print("\n[!] Stopping parallel ingestion gracefully...", flush=True)
        engine.stop_signal.set()

    engine.stop_signal.set()
    gpu_thread.join(timeout=10.0)
    print("\n[✓] All 14 multilingual shards processed simultaneously!")


if __name__ == "__main__":
    main()
