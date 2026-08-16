"""
Offline Ingestion and Indexing Pipeline for MSMARCO-XI.
Coordinates:
  1. Loading Dataset (validation / train shards)
  2. Cleaning & Deduplication (TextCleaner)
  3. Multi-strategy Adaptive Chunking (AdaptiveChunker)
  4. Batch Dense Embedding Generation (EmbeddingManager)
  5. Resumable Qdrant Vector Upserting (QdrantVectorStore)
  6. BM25 Inverted Index Compilation & Disk Serialization
"""

import os
import sys
import json
import time
import uuid
from typing import List, Dict, Any, Optional

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from datasets import load_dataset
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from tqdm import tqdm

from backend.config import settings
from backend.embeddings import embedding_manager
from backend.retrieval import BM25SearchEngine
from ingestion.cleaner import TextCleaner
from ingestion.chunker import AdaptiveChunker


class IngestionPipeline:
    def __init__(
        self,
        dataset_name: str = "ai4bharat/MSMARCO-XI",
        data_file: str = "validation/hinval.parquet",
        target_lang: str = "hi",
        checkpoint_file: str = "data/ingestion_checkpoint.json"
    ):
        self.dataset_name = dataset_name
        self.data_file = data_file
        self.target_lang = target_lang
        self.checkpoint_file = checkpoint_file
        
        self.cleaner = TextCleaner()
        self.chunker = AdaptiveChunker()
        self.bm25_engine = BM25SearchEngine()
        
        # Setup Qdrant Client via retrieval vector_store
        from backend.retrieval import hybrid_retriever
        self.vector_store = hybrid_retriever.vector_store
        self.qdrant = self.vector_store.get_client()
            
        self._ensure_qdrant_collection()

    def _ensure_qdrant_collection(self):
        collections = [c.name for c in self.qdrant.get_collections().collections]
        if settings.QDRANT_COLLECTION not in collections:
            print(f"[*] Creating Qdrant collection: {settings.QDRANT_COLLECTION} (dim={settings.EMBEDDING_DIM})...")
            self.qdrant.create_collection(
                collection_name=settings.QDRANT_COLLECTION,
                vectors_config=qmodels.VectorParams(
                    size=settings.EMBEDDING_DIM,
                    distance=qmodels.Distance.COSINE
                )
            )

    def load_checkpoint(self) -> int:
        if os.path.exists(self.checkpoint_file):
            try:
                with open(self.checkpoint_file, "r") as f:
                    data = json.load(f)
                    return data.get("last_processed_index", 0)
            except Exception:
                return 0
        return 0

    def save_checkpoint(self, last_index: int, total_chunks: int):
        os.makedirs(os.path.dirname(self.checkpoint_file), exist_ok=True)
        with open(self.checkpoint_file, "w") as f:
            json.dump({
                "last_processed_index": last_index,
                "total_chunks_indexed": total_chunks,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
            }, f, indent=2)

    def run(
        self,
        max_records: int = 1000,
        batch_size: int = 64,
        resume: bool = True
    ) -> Dict[str, Any]:
        """
        Executes end-to-end ingestion:
          Extract -> Clean -> Chunk -> Embed -> Qdrant Upsert -> Build BM25
        """
        start_time = time.perf_counter()
        print(f"\n========================================================")
        print(f"[*] Starting Ingestion Pipeline for {self.dataset_name}")
        print(f"[*] Target File: {self.data_file}, Target Lang: {self.target_lang}")
        print(f"[*] Max Records: {max_records}, Batch Size: {batch_size}")
        print(f"========================================================\n")

        start_index = self.load_checkpoint() if resume else 0
        print(f"[*] Starting from record index: {start_index}")

        # Load Dataset
        ds = load_dataset(self.dataset_name, data_files={"validation": self.data_file}, split="validation")
        total_available = len(ds)
        end_index = min(total_available, start_index + max_records) if max_records > 0 else total_available

        all_cleaned_docs = []
        all_chunks: List[Dict[str, Any]] = []

        # 1. Clean & Chunk
        print(f"[*] Processing & Chunking records {start_index} to {end_index}...")
        records_slice = [ds[i] for i in range(start_index, end_index)]
        cleaned_docs, clean_stats = self.cleaner.clean_batch(records_slice, target_lang=self.target_lang)
        all_cleaned_docs.extend(cleaned_docs)

        print(f"[+] Cleaned {len(cleaned_docs)} valid documents (Skipped {clean_stats['duplicates_skipped']} dupes, {clean_stats['empty_or_short_skipped']} empty/short).")

        # Generate multi-strategy chunks
        for doc in cleaned_docs:
            # Primary: Sentence-aware chunks for precision
            sent_chunks = self.chunker.chunk_sentence_aware(doc)
            all_chunks.extend(sent_chunks)
            
            # Structural paragraph chunk
            struct_chunks = self.chunker.chunk_structural(doc)
            all_chunks.extend(struct_chunks)

        # Deduplicate chunks by text hash
        unique_chunks = []
        seen_chunk_hashes = set()
        for c in all_chunks:
            c_hash = hash(c["text"])
            if c_hash not in seen_chunk_hashes:
                seen_chunk_hashes.add(c_hash)
                unique_chunks.append(c)

        print(f"[+] Generated {len(unique_chunks)} unique indexed chunks from {len(cleaned_docs)} documents.")

        # 2. Batch Embedding & Qdrant Upsert
        print(f"[*] Computing embeddings and indexing into Qdrant in batches of {batch_size}...")
        total_chunks = len(unique_chunks)
        points_to_upsert = []

        for i in range(0, total_chunks, batch_size):
            batch_chunks = unique_chunks[i:i + batch_size]
            batch_texts = [c["text"] for c in batch_chunks]
            batch_embeddings = embedding_manager.embed_documents(batch_texts, batch_size=batch_size)

            qdrant_points = []
            for c, emb in zip(batch_chunks, batch_embeddings):
                point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, c["chunk_id"]))
                qdrant_points.append(
                    qmodels.PointStruct(
                        id=point_id,
                        vector=emb.tolist(),
                        payload=c
                    )
                )

            # Upsert to Qdrant
            self.qdrant.upsert(
                collection_name=settings.QDRANT_COLLECTION,
                points=qdrant_points,
                wait=True
            )
            print(f"    Indexed {min(i + batch_size, total_chunks)} / {total_chunks} chunks...")

        # 3. Build & Save BM25 Index
        print(f"[*] Building and saving BM25 keyword index...")
        self.bm25_engine.build_index(unique_chunks, save_path=settings.BM25_INDEX_PATH)

        # 4. Save checkpoint
        self.save_checkpoint(end_index, total_chunks)

        total_elapsed = time.perf_counter() - start_time
        print(f"\n[+] Ingestion completed successfully in {total_elapsed:.2f}s!")
        print(f"[+] Total Indexed Documents: {len(cleaned_docs):,}")
        print(f"[+] Total Indexed Chunks: {len(unique_chunks):,}")
        print(f"[+] Checkpoint saved at: {self.checkpoint_file}\n")

        return {
            "records_processed": len(records_slice),
            "documents_indexed": len(cleaned_docs),
            "chunks_indexed": len(unique_chunks),
            "elapsed_seconds": round(total_elapsed, 2)
        }


if __name__ == "__main__":
    records_limit = 1000
    if len(sys.argv) > 1:
        records_limit = int(sys.argv[1])
    pipeline = IngestionPipeline()
    pipeline.run(max_records=records_limit)
