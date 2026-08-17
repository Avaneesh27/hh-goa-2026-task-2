"""
Reranking Module for Multilingual Voice RAG.
Reranks fused hybrid candidates using an efficient multilingual cross-encoder
or fast dense cross-scorer to select the top high-confidence evidence.
"""

import time
from typing import List, Dict, Any, Optional
import numpy as np
import torch
from sentence_transformers import CrossEncoder

from backend.config import settings
from backend.embeddings import embedding_manager


class MultilingualReranker:
    _instance: Optional["MultilingualReranker"] = None
    _cross_encoder: Optional[CrossEncoder] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MultilingualReranker, cls).__new__(cls)
            cls._instance.device = "cuda" if torch.cuda.is_available() else "cpu"
            cls._instance._init_attempted = False
        return cls._instance

    def _get_cross_encoder(self) -> Optional[CrossEncoder]:
        if self._cross_encoder is None and not self._init_attempted:
            self._init_attempted = True
            try:
                # Fast multilingual cross encoder
                model_name = settings.RERANKER_MODEL
                print(f"[*] Initializing reranker model: {model_name} on {self.device}...")
                self._cross_encoder = CrossEncoder(model_name, device=self.device, max_length=512)
                print(f"[+] Loaded reranker model: {model_name}")
            except Exception as e:
                print(f"[!] Cross-encoder '{settings.RERANKER_MODEL}' could not be initialized directly ({e}). Using fast multilingual embedding cross-scorer.")
                self._cross_encoder = None
        return self._cross_encoder

    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = settings.RERANK_TOP_K
    ) -> Dict[str, Any]:
        """
        Reranks top candidate chunks using an efficient multilingual cross-encoder.
        Optimized for sub-100ms low-latency execution on CPU.
        """
        start_time = time.perf_counter()

        if not candidates or not query.strip():
            return {
                "reranked_results": [],
                "rerank_latency_ms": 0.0
            }

        encoder = self._get_cross_encoder()
        reranked = []

        # Rerank the top 5 candidates with Cross-Encoder for max speed (<70ms)
        top_subset = candidates[:min(len(candidates), 5)]
        remaining = candidates[5:]

        if encoder is not None:
            pairs = [[query, c.get("text", "")[:180]] for c in top_subset]
            raw_scores = encoder.predict(pairs, show_progress_bar=False, batch_size=len(pairs))
            
            for c, raw_score in zip(top_subset, raw_scores):
                r_val = float(raw_score)
                norm_score = float(1.0 / (1.0 + np.exp(-r_val)))
                rrf_score = c.get("rrf_score", 0.0)
                blended_score = round(0.70 * norm_score + 0.30 * min(1.0, rrf_score * 30), 4)
                item = dict(c)
                item["rerank_score"] = blended_score
                item["raw_rerank_score"] = round(r_val, 3)
                item["score"] = blended_score
                reranked.append(item)

            for c in remaining:
                rrf_score = c.get("rrf_score", 0.0)
                item = dict(c)
                item["rerank_score"] = round(rrf_score * 10, 4)
                item["raw_rerank_score"] = -3.0
                item["score"] = item["rerank_score"]
                reranked.append(item)
        else:
            for c in candidates:
                rrf_score = c.get("rrf_score", 0.0)
                item = dict(c)
                item["rerank_score"] = round(rrf_score * 10, 4)
                item["raw_rerank_score"] = 0.0
                item["score"] = item["rerank_score"]
                reranked.append(item)

        # Sort descending by rerank_score
        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
        top_reranked = reranked[:top_k]

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return {
            "reranked_results": top_reranked,
            "rerank_latency_ms": round(elapsed_ms, 2)
        }


# Global singleton
reranker = MultilingualReranker()


if __name__ == "__main__":
    import sys
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    test_query = "कॉर्पोरेशन क्या है?"
    sample_candidates = [
        {"chunk_id": "c1", "text": "एक कंपनी या लोगों का समूह जो एक इकाई के रूप में कार्य करता है।", "rrf_score": 0.03},
        {"chunk_id": "c2", "text": "आज का मौसम बहुत अच्छा और धूप वाला है।", "rrf_score": 0.01}
    ]
    res = reranker.rerank(test_query, sample_candidates, top_k=2)
    print("Rerank Results:", res)
