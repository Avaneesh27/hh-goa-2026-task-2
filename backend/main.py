"""
FastAPI Application Entrypoint for Voice-Enabled RAG System.
Configures CORS, lifespan events for pre-warming embeddings/BM25, and mounts routes.
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.config import settings
from backend.api import router
from backend.embeddings import embedding_manager
from backend.retrieval import hybrid_retriever
from backend.reranker import reranker


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warming on startup for low-latency responses
    print("\n[🚀] Starting HH Goa 2026 Voice RAG Backend Service...")
    print(f"[*] Pre-loading Embedding Model ({settings.EMBEDDING_MODEL})...")
    _ = embedding_manager.model
    print(f"[*] Pre-loading BM25 Index ({len(hybrid_retriever.bm25_engine.corpus_chunks)} chunks)...")
    print(f"[*] Pre-loading Cross-Encoder Reranker ({settings.RERANKER_MODEL})...")
    _ = reranker._get_cross_encoder()
    print("[+] All models and indexes warmed up and ready for sub-200ms requests.\n")
    yield
    print("[*] Shutting down backend service.")


app = FastAPI(
    title="HH Goa 2026 — Voice-Enabled RAG System",
    description="Production-grade, low-latency, deterministic Multilingual Voice RAG System for Hindi and English.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=False
    )
