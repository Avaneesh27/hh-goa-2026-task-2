"""
Centralized Configuration Module for Voice-Enabled RAG System.
Loads environment variables safely and defines typed parameters, thresholds, and constants.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Local Dataset Synthesis & Generation (Zero Gemini/External API dependencies required)
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "local")  # "local", "ollama", "groq", "gemini", "openai"
    LLM_MODEL: str = os.getenv("LLM_MODEL", "local")
    LLM_BASE_URL: Optional[str] = os.getenv("LLM_BASE_URL", None)

    # Embeddings & Reranker
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    RERANKER_MODEL: str = os.getenv("RERANKER_MODEL", "BAAI/bge-reranker-base")
    EMBEDDING_DIM: int = 384  # 384 for MiniLM, 768 for e5/bge-base, 1024 for bge-m3

    # Qdrant Vector Database
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_API_KEY: Optional[str] = os.getenv("QDRANT_API_KEY", None)
    QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION", "msmarco_hindi_english")
    QDRANT_PREFER_GRPC: bool = False
    USE_LOCAL_QDRANT_STORAGE: bool = os.getenv("USE_LOCAL_QDRANT_STORAGE", "true").lower() == "true"
    LOCAL_QDRANT_PATH: str = os.getenv("LOCAL_QDRANT_PATH", "data/qdrant_db")

    # BM25 Index Path
    BM25_INDEX_PATH: str = os.getenv("BM25_INDEX_PATH", "data/bm25_index.pkl")

    # Networking & Service URLs
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Configurable Retrieval Constants
    DENSE_TOP_K: int = 20
    BM25_TOP_K: int = 20
    RERANK_TOP_K: int = 5
    RRF_K: int = 60
    MAX_CONTEXT_CHUNKS: int = 5
    MAX_CONTEXT_TOKENS: int = 2500
    MIN_RETRIEVAL_SCORE: float = 0.20  # Minimum confidence threshold before abstaining
    MIN_RERANK_SCORE: float = 0.25     # Minimum cross-encoder threshold
    MAX_AUDIO_SECONDS: int = 30
    DEFAULT_CHUNK_STRATEGY: str = "sentence_aware"


# Global settings singleton
settings = Settings()
