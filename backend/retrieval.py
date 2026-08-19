"""
Hybrid Retrieval Engine for Hindi and English RAG.
Implements:
  1. Multilingual Tokenization & BM25 Keyword Search
  2. Qdrant Dense Vector Search (Local Disk / Remote Server)
  3. Metadata Filtering (Language, Level, Query Type)
  4. Reciprocal Rank Fusion (RRF)
  5. Unified Hybrid Retrieval Harness
"""

import os
import re
import pickle
import time
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from rank_bm25 import BM25Okapi
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from backend.config import settings
from backend.embeddings import embedding_manager


# =============================================================================
# 1. Multilingual Tokenizer for BM25
# =============================================================================
class MultilingualTokenizer:
    def __init__(self):
        # Regex matching words across Latin, Arabic/Urdu, and all 14 Indic scripts
        self.word_pattern = re.compile(
            r"[\w\u0600-\u06FF\u0750-\u077F\u0900-\u0D7F\uFB50-\uFDFF\uFE70-\uFEFF]+",
            re.UNICODE
        )
        
        # Stopwords across Hindi, Marathi, Bengali, Tamil, Telugu, and English
        self.stopwords = {
            # English
            "a", "an", "the", "in", "on", "at", "of", "to", "is", "was", "are", "were",
            "and", "or", "for", "with", "by", "from", "it", "this", "that", "what", "which",
            # Hindi / Marathi
            "है", "हैं", "था", "थी", "थे", "का", "के", "की", "को", "में", "पर", "से",
            "और", "या", "ने", "एक", "यह", "वह", "जो", "तो", "भी", "ही", "कि",
            "आहे", "आहेत", "होता", "होती", "होते", "चा", "ची", "चे", "च्या",
            # Bengali
            "হয়", "হলো", "ছিল", "এর", "কে", "এবং", "বা", "এই", "সেই",
            # Tamil
            "ஆகும்", "இருந்தது", "உள்ளது", "மற்றும்", "அல்லது", "ஒரு", "இந்த",
            # Telugu
            "ఉంది", "ఉన్నారు", "మరియు", "లేదా", "ఒక", "ఈ", "ఆ"
        }

    def tokenize(self, text: str) -> List[str]:
        if not text:
            return []
        tokens = self.word_pattern.findall(text.lower())
        return [t for t in tokens if len(t) > 1 and t not in self.stopwords]


# =============================================================================
# 2. BM25 Search Engine
# =============================================================================
class BM25SearchEngine:
    def __init__(self, index_path: Optional[str] = None):
        self.tokenizer = MultilingualTokenizer()
        self.index_path = index_path or settings.BM25_INDEX_PATH
        self.corpus_chunks: List[Dict[str, Any]] = []
        self.bm25: Optional[BM25Okapi] = None
        self._load_index()

    def _load_index(self):
        if os.path.exists(self.index_path):
            try:
                start = time.perf_counter()
                with open(self.index_path, "rb") as f:
                    data = pickle.load(f)
                    self.corpus_chunks = data.get("chunks", [])
                    self.bm25 = data.get("bm25")
                print(f"[+] Loaded BM25 index ({len(self.corpus_chunks)} chunks) in {(time.perf_counter() - start)*1000:.2f}ms")
            except Exception as e:
                print(f"[!] Warning: Failed to load BM25 index from {self.index_path}: {e}")
                self.bm25 = None
        else:
            self.bm25 = None

    def build_index(self, chunks: List[Dict[str, Any]], save_path: Optional[str] = None, append: bool = False):
        """Builds BM25 index from chunk list and serializes to disk, with optional incremental appending."""
        start = time.perf_counter()
        if append and self.corpus_chunks:
            existing_ids = {c.get("chunk_id") for c in self.corpus_chunks}
            new_chunks = [c for c in chunks if c.get("chunk_id") not in existing_ids]
            all_chunks = self.corpus_chunks + new_chunks
        else:
            all_chunks = chunks

        print(f"[*] Building BM25 index for {len(all_chunks)} chunks...")
        self.corpus_chunks = all_chunks
        tokenized_corpus = [self.tokenizer.tokenize(c.get("text", "")) for c in all_chunks]
        self.bm25 = BM25Okapi(tokenized_corpus)

        save_path = save_path or self.index_path
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, "wb") as f:
            pickle.dump({"chunks": self.corpus_chunks, "bm25": self.bm25}, f)
        print(f"[+] Built and saved BM25 index ({len(all_chunks)} total chunks) to {save_path} in {(time.perf_counter() - start):.2f}s")

    def search(
        self,
        query: str,
        top_k: int = 20,
        filter_language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Performs BM25 search with optional language filtering."""
        if not self.bm25 or not self.corpus_chunks or not query.strip():
            return []

        query_tokens = self.tokenizer.tokenize(query)
        if not query_tokens:
            query_tokens = query.strip().lower().split()

        # Cross-lingual synonym expansion for common English and Indic query terms
        CROSS_LINGUAL_SYNONYMS = {
            "corporation": ["कॉर्पोरेशन", "निगम", "कর্পোরেশন", "கார்ப்பரேஷன்", "కార్పొరేషన్", "કોર્પોરેશન", "ಕಾರ್ಪೊರೇಷನ್", "ਕਾਰਪੋਰੇਸ਼ਨ", "କର୍ପୋରେସନ୍", "കോർപ്പറേഷൻ", "کارپوریشن"],
            "company": ["कंपनी", "কোম্পানি", "நிறுவனம்", "సంస్థ", "કંપની", "ಕಂಪನಿ", "കമ്പനി", "ਕੰਪਨੀ", "କମ୍ପାନୀ", "کمپنی"],
            "business": ["व्यवसाय", "व्यापार", "ব্যবসা", "வணிகம்", "వ్యాపారం", "વેપાર", "ವ್ಯವಹಾರ", "ബിസിനസ്", "ਵਪਾਰ", "ବ୍ୟବସାୟ", "کاروبار"],
            "website": ["वेबसाइट", "ৱেবছাইট", "ওয়েবসাইট", "இணையதளம்", "వెబ్‌సైట్", "વેબસાઇટ", "ವೆಬ್‌ಸೈಟ್", "വെബ്സൈറ്റ്", "ਵੈੱਬਸਾਈਟ", "ୱେବସାଇଟ୍", "ویب سائٹ"],
            "olympics": ["ओलंपिक", "অলিম্পিক", "ஒலிம்பிக்", "ఒలింపిక్స్", "ઓલિમ્પિક", "ಒಲಿಂಪಿಕ್ಸ್", "ഒളിമ്പിക്സ്", "ਓਲੰਪਿਕ", "ଅଲିମ୍ପିକ୍", "اولمپکس"],
            "marathon": ["मैराथन", "ম্যারাথন", "மராத்தான்", "మారథాన్", "મેરેથોન", "ಮ್ಯಾರಥಾನ್", "മാരത്തൺ", "ਮੈਰਾਥਨ", "ମାରାଥନ୍", "میراتھن"],
            "cell": ["कोशिका", "কোষ", "செல்", "కణం", "કોષ", "ಕಣ", "കോശം", "ਸੈੱਲ", "କୋଷ", "خلیہ"],
            "dna": ["डीएनए", "ডিএনএ", "டிஎன்ஏ", "డిఎన్ఎ", "ડીએનએ", "ಡಿಎನ್‌ಎ", "ഡിഎൻഎ", "ਡੀਐਨਏ", "ଡିଏନଏ", "ڈی این اے"],
            "temperature": ["तापमान", "তাপমাত্রা", "வெப்பநிலை", "ఉష్ణోగ్రత", "તાપમાન", "ತಾપಮಾನ", "താപനില", "ਤਾਪਮਾਨ", "താପମାତ୍ରା", "درجہ حرارت"],
            "president": ["राष्ट्रपति", "রাষ্ট্রপতি", "ஜனாதிபதி", "రాష్ట్రపతి", "રાષ્ટ્રપતિ", "ರಾಷ್ಟ್ರಪತಿ", "രാഷ്ട്രപതി", "ਰਾਸ਼ਟਰਪਤੀ", "ରାଷ୍ଟ୍ରପତି", "صدر"],
            "computer": ["कंप्यूटर", "কম্পিউটার", "கணினி", "కంప్యూటర్", "કમ્પ્યુટર", "ಕಂಪ್ಯೂಟರ್", "കമ്പ്യൂട്ടർ", "ਕੰਪਿਊਟਰ", "କମ୍ପ୍ୟୁଟର", "کمپیوٹر"],
            "book": ["किताब", "पुस्तक", "বই", "புத்தகம்", "పుస్తకం", "પુસ્તક", "ಪುಸ್ತಕ", "പുസ്തകം", "ਕਿਤਾਬ", "ବହି", "کتاب"],
        }
        expanded_tokens = list(query_tokens)
        for t in query_tokens:
            t_low = t.lower()
            if t_low in CROSS_LINGUAL_SYNONYMS:
                expanded_tokens.extend(CROSS_LINGUAL_SYNONYMS[t_low])

        raw_scores = self.bm25.get_scores(expanded_tokens)
        top_indices = np.argsort(raw_scores)[::-1]

        results = []
        max_score = float(raw_scores[top_indices[0]]) if len(top_indices) > 0 and raw_scores[top_indices[0]] > 0 else 1.0

        for idx in top_indices:
            score = float(raw_scores[idx])
            if score <= 0.0:
                break
            chunk = self.corpus_chunks[idx]

            # Metadata filter check
            if filter_language and chunk.get("language") != filter_language:
                continue

            norm_score = round(score / max_score, 4) if max_score > 0 else 0.0
            results.append({
                "chunk_id": chunk.get("chunk_id"),
                "document_id": chunk.get("document_id"),
                "parent_id": chunk.get("parent_id"),
                "text": chunk.get("text"),
                "language": chunk.get("language"),
                "level": chunk.get("level"),
                "strategy": chunk.get("chunking_strategy"),
                "position": chunk.get("position"),
                "metadata": chunk.get("metadata", {}),
                "score": norm_score,
                "raw_score": round(score, 4),
                "retrieval_source": "bm25"
            })

            if len(results) >= top_k:
                break

        return results


# =============================================================================
# 3. Qdrant Dense Vector Store
# =============================================================================
class QdrantVectorStore:
    _instance: Optional["QdrantVectorStore"] = None
    _shared_client: Optional[QdrantClient] = None

    def __init__(self, client: Optional[QdrantClient] = None):
        self.collection_name = settings.QDRANT_COLLECTION
        self.dim = settings.EMBEDDING_DIM
        if client:
            self.client = client
        else:
            self.client = None

    def get_client(self) -> Optional[QdrantClient]:
        if self.client is not None:
            return self.client
        if QdrantVectorStore._shared_client is not None:
            self.client = QdrantVectorStore._shared_client
            return self.client

        try:
            if settings.USE_LOCAL_QDRANT_STORAGE:
                os.makedirs(settings.LOCAL_QDRANT_PATH, exist_ok=True)
                self.client = QdrantClient(path=settings.LOCAL_QDRANT_PATH)
            else:
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY,
                    prefer_grpc=settings.QDRANT_PREFER_GRPC
                )
            QdrantVectorStore._shared_client = self.client
            self._ensure_collection()
        except Exception as e:
            print(f"[!] Warning: Could not connect to Qdrant: {e}")
            self.client = None
        return self.client

    def _ensure_collection(self):
        client = self.get_client()
        if not client:
            return
        try:
            collections = [c.name for c in client.get_collections().collections]
            if self.collection_name not in collections:
                print(f"[*] Creating Qdrant collection '{self.collection_name}' (dim={self.dim}, Cosine)...")
                client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=self.dim,
                        distance=qmodels.Distance.COSINE
                    )
                )
        except Exception as e:
            print(f"[!] Error ensuring collection: {e}")

    def search(
        self,
        query_vector: List[float],
        top_k: int = 20,
        filter_language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Searches Qdrant with cosine similarity and optional language filtering."""
        client = self.get_client()
        if not client:
            return []

        q_filter = None
        if filter_language:
            q_filter = qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="language",
                        match=qmodels.MatchValue(value=filter_language)
                    )
                ]
            )

        try:
            # Modern Qdrant client (v1.10+) uses query_points
            search_result = client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=q_filter,
                limit=top_k
            )
            points = search_result.points if hasattr(search_result, "points") else search_result
        except Exception as e:
            print(f"[!] Qdrant query_points error: {e}")
            return []

        results = []
        for hit in points:
            payload = hit.payload or {}
            score = getattr(hit, "score", 0.0) or 0.0
            results.append({
                "chunk_id": payload.get("chunk_id", str(hit.id)),
                "document_id": payload.get("document_id"),
                "parent_id": payload.get("parent_id"),
                "text": payload.get("text", ""),
                "language": payload.get("language"),
                "level": payload.get("level"),
                "strategy": payload.get("chunking_strategy"),
                "position": payload.get("position"),
                "metadata": payload.get("metadata", {}),
                "score": round(float(score), 4),
                "raw_score": round(float(score), 4),
                "retrieval_source": "dense"
            })

        return results


# =============================================================================
# 4. Reciprocal Rank Fusion (RRF)
# =============================================================================
def reciprocal_rank_fusion(
    dense_results: List[Dict[str, Any]],
    bm25_results: List[Dict[str, Any]],
    k: int = 60,
    top_k: int = 20,
    preferred_language: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Combines dense and sparse results using Reciprocal Rank Fusion with language-aware soft boosting:
    RRF(d) = (sum(1 / (k + rank_i(d)))) * (1.10 if lang == preferred_lang else 1.0)
    Deduplicates candidates by text hash to prevent identical passages from crowding the top-k.
    """
    rrf_scores: Dict[str, float] = {}
    doc_map: Dict[str, Dict[str, Any]] = {}
    dense_ranks: Dict[str, int] = {}
    bm25_ranks: Dict[str, int] = {}

    # Rank dense results
    for rank, res in enumerate(dense_results, 1):
        cid = res["chunk_id"]
        dense_ranks[cid] = rank
        doc_map[cid] = res
        base_score = 1.0 / (k + rank)
        rrf_scores[cid] = rrf_scores.get(cid, 0.0) + base_score

    # Rank BM25 results
    for rank, res in enumerate(bm25_results, 1):
        cid = res["chunk_id"]
        bm25_ranks[cid] = rank
        if cid not in doc_map:
            doc_map[cid] = res
        base_score = 1.0 / (k + rank)
        rrf_scores[cid] = rrf_scores.get(cid, 0.0) + base_score

    # Apply soft metadata language boost (+10% for same-language without hard filtering)
    if preferred_language:
        pref = preferred_language.lower()
        for cid in rrf_scores:
            doc_lang = (doc_map[cid].get("language") or "").lower()
            if doc_lang == pref:
                rrf_scores[cid] *= 1.10

    # Sort fused results by boosted RRF score descending
    sorted_chunks = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

    fused_results = []
    seen_text_hashes = set()

    for cid, score in sorted_chunks:
        item = dict(doc_map[cid])
        text_content = item.get("text", "").strip()
        t_hash = hash(text_content)

        # Deduplicate identical passage texts
        if t_hash in seen_text_hashes:
            continue
        seen_text_hashes.add(t_hash)

        item["rrf_score"] = round(score, 5)
        item["score"] = round(score, 5)
        item["dense_rank"] = dense_ranks.get(cid, None)
        item["bm25_rank"] = bm25_ranks.get(cid, None)
        item["retrieval_source"] = "hybrid_rrf"
        fused_results.append(item)

        if len(fused_results) >= top_k:
            break

    return fused_results


# =============================================================================
# 5. Master Hybrid Retrieval Orchestrator
# =============================================================================
class HybridRetriever:
    def __init__(self):
        self.bm25_engine = BM25SearchEngine()
        self.vector_store = QdrantVectorStore()

    def retrieve(
        self,
        query: str,
        dense_top_k: int = settings.DENSE_TOP_K,
        bm25_top_k: int = settings.BM25_TOP_K,
        rrf_k: int = settings.RRF_K,
        fused_top_k: int = settings.DENSE_TOP_K,
        filter_language: Optional[str] = None,
        preferred_language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes hybrid retrieval:
          1. Embed query
          2. Dense ANN vector search via Qdrant
          3. BM25 keyword search
          4. Candidate Fusion via RRF with language soft boosting & deduplication
        """
        start_time = time.perf_counter()

        # 1. Dense search
        t_embed_start = time.perf_counter()
        query_vector = embedding_manager.embed_query(query)
        t_embed = (time.perf_counter() - t_embed_start) * 1000

        t_dense_start = time.perf_counter()
        dense_results = self.vector_store.search(
            query_vector=query_vector,
            top_k=dense_top_k,
            filter_language=filter_language
        )
        t_dense = (time.perf_counter() - t_dense_start) * 1000

        # 2. BM25 search
        t_bm25_start = time.perf_counter()
        bm25_results = self.bm25_engine.search(
            query=query,
            top_k=bm25_top_k,
            filter_language=filter_language
        )
        t_bm25 = (time.perf_counter() - t_bm25_start) * 1000

        # 3. Fusion
        t_fuse_start = time.perf_counter()
        fused_results = reciprocal_rank_fusion(
            dense_results=dense_results,
            bm25_results=bm25_results,
            k=rrf_k,
            top_k=fused_top_k,
            preferred_language=preferred_language or filter_language
        )
        t_fuse = (time.perf_counter() - t_fuse_start) * 1000

        total_retrieval_ms = (time.perf_counter() - start_time) * 1000

        return {
            "query": query,
            "dense_results": dense_results,
            "bm25_results": bm25_results,
            "fused_results": fused_results,
            "counts": {
                "dense": len(dense_results),
                "bm25": len(bm25_results),
                "fused": len(fused_results)
            },
            "timings_ms": {
                "embedding_ms": round(t_embed, 2),
                "dense_retrieval_ms": round(t_dense, 2),
                "bm25_ms": round(t_bm25, 2),
                "fusion_ms": round(t_fuse, 2),
                "total_ms": round(total_retrieval_ms, 2)
            }
        }


# Global singleton
hybrid_retriever = HybridRetriever()


if __name__ == "__main__":
    import sys
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("[*] Hybrid Retriever Initialized successfully.")
