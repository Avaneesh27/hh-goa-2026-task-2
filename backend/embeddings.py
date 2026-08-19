"""
Multilingual Embeddings Module for Hindi and English.
Wraps SentenceTransformer with lazy model loading, normalized output embeddings,
and an in-memory LRU query embedding cache for fast sub-millisecond repeated queries.
"""

import os
import time
import hashlib
from typing import List, Union, Optional
import numpy as np
import torch
from sentence_transformers import SentenceTransformer

from backend.config import settings


class EmbeddingManager:
    _instance: Optional["EmbeddingManager"] = None
    _model: Optional[SentenceTransformer] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingManager, cls).__new__(cls)
            cls._instance._query_cache = {}
            cls._instance._cache_max_size = 5000
            cls._instance.device = "cuda" if torch.cuda.is_available() else "cpu"
        return cls._instance

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            if os.path.exists("models/msmarco-xi-multilingual-biencoder"):
                model_target = "models/msmarco-xi-multilingual-biencoder"
            elif os.path.exists("models/msmarco-xi-multilingual-rl-biencoder"):
                model_target = "models/msmarco-xi-multilingual-rl-biencoder"
            else:
                model_target = settings.EMBEDDING_MODEL
            print(f"[*] Loading embedding model: {model_target} on {self.device}...")
            start = time.perf_counter()
            self._model = SentenceTransformer(model_target, device=self.device)
            print(f"[+] Loaded embedding model in {(time.perf_counter() - start):.3f}s")
        return self._model

    def embed_query(self, query: str) -> List[float]:
        """
        Embeds a single query string with normalization and in-memory caching.
        Returns a Python list of floats.
        """
        if not query or not query.strip():
            return [0.0] * settings.EMBEDDING_DIM

        cache_key = hashlib.md5(query.strip().lower().encode("utf-8")).hexdigest()
        if cache_key in self._query_cache:
            return self._query_cache[cache_key]

        embedding = self.model.encode(
            query.strip(),
            convert_to_numpy=True,
            normalize_embeddings=True
        ).tolist()

        if len(self._query_cache) >= self._cache_max_size:
            # Simple eviction
            self._query_cache.pop(next(iter(self._query_cache)))

        self._query_cache[cache_key] = embedding
        return embedding

    def embed_documents(self, documents: List[str], batch_size: int = 64) -> np.ndarray:
        """
        Embeds a batch of document strings for offline ingestion with normalization.
        Returns a NumPy array of shape (N, dim).
        """
        if not documents:
            return np.empty((0, settings.EMBEDDING_DIM), dtype=np.float32)

        return self.model.encode(
            documents,
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True
        )


# Global singleton instance
embedding_manager = EmbeddingManager()


if __name__ == "__main__":
    import sys
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    em = EmbeddingManager()
    sample_hi = "कॉर्पोरेशन क्या है?"
    sample_en = "what is a corporation?"
    emb_hi = em.embed_query(sample_hi)
    emb_en = em.embed_query(sample_en)
    print(f"Hindi Query Embedding Dim: {len(emb_hi)}, norm: {np.linalg.norm(emb_hi):.3f}")
    print(f"English Query Embedding Dim: {len(emb_en)}, norm: {np.linalg.norm(emb_en):.3f}")
    sim = np.dot(emb_hi, emb_en)
    print(f"Cosine Similarity (Hindi vs English): {sim:.4f}")
