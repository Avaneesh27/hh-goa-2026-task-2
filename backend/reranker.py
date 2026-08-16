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
        Reranks a list of candidate chunk dictionaries against the query.
        Returns top_k reranked items with normalized rerank_score and latency.
        """
        start_time = time.perf_counter()

        if not candidates or not query.strip():
            return {
                "reranked_results": [],
                "rerank_latency_ms": 0.0
            }

        encoder = self._get_cross_encoder()
        reranked = []

        if encoder is not None:
            pairs = [[query, c.get("text", "")] for c in candidates]
            raw_scores = encoder.predict(pairs, show_progress_bar=False)
            
            for c, raw_score in zip(candidates, raw_scores):
                r_val = float(raw_score)
                # Calibrated sigmoid: raw score > 0 means relevant, raw score < -2 means irrelevant
                norm_score = round(1.0 / (1.0 + np.exp(-r_val)), 4)
                item = dict(c)
                item["rerank_score"] = norm_score
                item["raw_rerank_score"] = round(r_val, 3)
                item["score"] = norm_score
                reranked.append(item)
        else:
            # Fast embedding-based cross-scoring fallback
            q_emb = np.array(embedding_manager.embed_query(query))
            doc_texts = [c.get("text", "") for c in candidates]
            doc_embs = embedding_manager.embed_documents(doc_texts, batch_size=len(doc_texts))
            
            for c, d_emb in zip(candidates, doc_embs):
                cos_sim = float(np.dot(q_emb, d_emb))
                # Combine RRF rank bonus with semantic score
                rrf_score = c.get("rrf_score", 0.0)
                blended_score = round(0.7 * cos_sim + 0.3 * (rrf_score * 30), 4)
                item = dict(c)
                item["rerank_score"] = blended_score
                item["score"] = blended_score
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
