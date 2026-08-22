import os
import sys
import json
import time
from pathlib import Path

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
import torch

from backend.config import settings
from backend.embeddings import embedding_manager
from backend.retrieval import BM25SearchEngine, faiss_vector_store
from ingestion.cleaner import TextCleaner
from ingestion.chunker import AdaptiveChunker

def ingest_hindi(limit_rows=5000, batch_size=256, embed_batch_size=256):
    print("=" * 75)
    print(f"🚀 INGESTING HINDI (hi) INTO FAISS | Target: {limit_rows:,} rows")
    print("=" * 75)
    
    local_file = hf_hub_download(
        repo_id="ai4bharat/MSMARCO-XI",
        filename="validation/hinval.parquet",
        repo_type="dataset"
    )
    parquet_file = pq.ParquetFile(local_file)
    
    total_rows = parquet_file.metadata.num_rows
    target_rows = min(total_rows, limit_rows)
    print(f"[*] Total rows: {total_rows:,} | Target: {target_rows:,}")
    
    cleaner = TextCleaner()
    chunker = AdaptiveChunker()
    
    # Delete old files if starting fresh
    db_file = PROJECT_ROOT / "data" / "payloads_hi.sqlite"
    idx_file = PROJECT_ROOT / "data" / "faiss_hi.index"
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
        
    if "hi" in faiss_vector_store._indices:
        del faiss_vector_store._indices["hi"]
    if "hi" in faiss_vector_store._connections:
        del faiss_vector_store._connections["hi"]
        
    start_time = time.perf_counter()
    current_row = 0
    total_chunks_indexed = 0
    
    for batch in parquet_file.iter_batches(batch_size=batch_size):
        batch_len = len(batch)
        batch_start = current_row
        batch_end = current_row + batch_len
        current_row = batch_end
        
        pydict = batch.to_pydict()
        records_count = len(pydict["query_id"])
        batch_records = []
        
        for i in range(records_count):
            global_row = batch_start + i
            if global_row >= target_rows:
                break
                
            rec = {
                "query_id": pydict["query_id"][i],
                "query": pydict["query"][i],
                "passages": pydict["passages"][i] if "passages" in pydict else {}
            }
            batch_records.append(rec)
            
        if not batch_records:
            break
            
        # 1. Clean & Chunk
        cleaned_docs, _ = cleaner.clean_batch(batch_records, target_lang="hi")
        batch_chunks = []
        for doc in cleaned_docs:
            atomic_chunks = chunker.chunk_atomic_passage(doc)
            batch_chunks.extend(atomic_chunks)
            
        # 2. Deduplicate
        seen_texts = set()
        unique_batch_chunks = []
        for c in batch_chunks:
            t_hash = hash(c["text"])
            if t_hash not in seen_texts:
                seen_texts.add(t_hash)
                unique_batch_chunks.append(c)
                
        # 3. Vectorize & Index
        if unique_batch_chunks:
            batch_texts = [c["text"] for c in unique_batch_chunks]
            with torch.inference_mode():
                batch_embeddings = embedding_manager.embed_documents(batch_texts, batch_size=embed_batch_size)
                
            faiss_vector_store.add_chunks(
                lang_code="hi",
                chunks=unique_batch_chunks,
                embeddings=batch_embeddings
            )
            total_chunks_indexed += len(unique_batch_chunks)
            
        processed_so_far = min(current_row, target_rows)
        elapsed = time.perf_counter() - start_time
        rate = processed_so_far / max(elapsed, 0.001)
        eta_sec = (target_rows - processed_so_far) / max(rate, 0.001)
        
        if processed_so_far % (batch_size * 4) == 0 or processed_so_far >= target_rows:
            pct = (processed_so_far / target_rows) * 100.0
            faiss_vector_store.save_index_to_disk("hi")
            print(f"  [HI] Ingested: {processed_so_far:,}/{target_rows:,} ({pct:.1f}%) | "
                  f"Chunks: {total_chunks_indexed:,} | Speed: {rate:.1f} rows/s | ETA: {eta_sec/60:.1f}m", flush=True)
                  
        if current_row >= target_rows:
            break
            
    faiss_vector_store.save_index_to_disk("hi")
    total_time = time.perf_counter() - start_time
    print(f"[✓] Hindi Ingestion Finished: {target_rows:,} rows -> {total_chunks_indexed:,} chunks in {total_time/60:.2f}m")

if __name__ == "__main__":
    limit = 5000
    if len(sys.argv) > 1:
        limit = int(sys.argv[1])
    ingest_hindi(limit_rows=limit)
