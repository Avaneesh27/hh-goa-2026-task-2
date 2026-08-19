"""
FastAPI Routes and REST API Endpoints for Voice-Enabled RAG System.
Endpoints:
  - GET  /health: Health check, database connection status, and model metadata.
  - POST /api/text/query: Plain-text RAG pipeline query with latency trace.
  - POST /api/voice/query: Full voice query (Audio -> STT -> Hybrid Search -> Grounded Answer).
  - GET  /api/metrics: Latency statistics and aggregated system metrics.
  - GET  /api/config: Public sanitized runtime configurations and thresholds.
"""

import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query, Response
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.schemas import (
    RAGResponse,
    TextQueryRequest,
    HealthResponse,
    TTSRequest
)
from backend.orchestrator import rag_orchestrator

router = APIRouter()

# In-memory metrics tracker
metrics_collector = {
    "total_requests": 0,
    "voice_requests": 0,
    "text_requests": 0,
    "abstained_requests": 0,
    "grounded_requests": 0,
    "latencies_ms": []
}


@router.get("/health", response_model=HealthResponse)
async def health_check():
    indexed_count = len(rag_orchestrator.retriever.bm25_engine.corpus_chunks)
    return HealthResponse(
        status="healthy",
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        dataset_collection=settings.QDRANT_COLLECTION,
        indexed_chunks=indexed_count,
        embedding_model=settings.EMBEDDING_MODEL,
        reranker_model=settings.RERANKER_MODEL,
        llm_provider=settings.LLM_PROVIDER,
        llm_model=settings.LLM_MODEL
    )


@router.post("/api/text/query", response_model=RAGResponse)
async def handle_text_query(req: TextQueryRequest):
    """Processes a plain-text user query through the full deterministic RAG pipeline."""
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")

    metrics_collector["total_requests"] += 1
    metrics_collector["text_requests"] += 1

    resp = await rag_orchestrator.process_text_query(
        query=req.query,
        language=req.language,
        filter_language=req.filter_language
    )

    if resp.abstained:
        metrics_collector["abstained_requests"] += 1
    if resp.grounded:
        metrics_collector["grounded_requests"] += 1

    metrics_collector["latencies_ms"].append(resp.latency.end_to_end_ms)
    return resp


@router.post("/api/voice/query", response_model=RAGResponse)
async def handle_voice_query(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    transcript: Optional[str] = Form(None)
):
    """
    Receives voice audio stream (WAV, WEBM, MP3), validates payload, executes Sarvam STT,
    and runs the full grounded RAG pipeline.
    """
    if not file:
        raise HTTPException(status_code=400, detail="Audio file is required.")

    audio_bytes = await file.read()
    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty or corrupted.")

    metrics_collector["total_requests"] += 1
    metrics_collector["voice_requests"] += 1

    filename = file.filename or "recording.wav"
    resp = await rag_orchestrator.process_voice_query(
        audio_bytes=audio_bytes,
        filename=filename,
        language_hint=language,
        transcript_fallback=transcript
    )

    if resp.abstained:
        metrics_collector["abstained_requests"] += 1
    if resp.grounded:
        metrics_collector["grounded_requests"] += 1

    metrics_collector["latencies_ms"].append(resp.latency.end_to_end_ms)
    return resp


@router.get("/api/metrics")
async def get_metrics():
    """Returns aggregated latency percentiles and request counts."""
    lats = sorted(metrics_collector["latencies_ms"])
    n = len(lats)

    def pct(p):
        return lats[int(n * p)] if n > 0 else 0.0

    percentiles = {
        "p50_ms": pct(0.50),
        "p70_ms": pct(0.70),
        "p90_ms": pct(0.90),
        "p95_ms": pct(0.95),
        "p99_ms": pct(0.99),
        "p100_ms": lats[-1] if n > 0 else 0.0,
        "avg_ms": round(sum(lats) / n, 2) if n > 0 else 0.0
    }

    return {
        "summary": {
            "total_requests": metrics_collector["total_requests"],
            "voice_requests": metrics_collector["voice_requests"],
            "text_requests": metrics_collector["text_requests"],
            "grounded_count": metrics_collector["grounded_requests"],
            "abstained_count": metrics_collector["abstained_requests"]
        },
        "latency_percentiles": percentiles
    }


@router.get("/api/config")
async def get_public_config():
    """Returns sanitized runtime configurations."""
    return {
        "embedding_model": settings.EMBEDDING_MODEL,
        "reranker_model": settings.RERANKER_MODEL,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "dense_top_k": settings.DENSE_TOP_K,
        "bm25_top_k": settings.BM25_TOP_K,
        "rerank_top_k": settings.RERANK_TOP_K,
        "rrf_k": settings.RRF_K,
        "max_context_chunks": settings.MAX_CONTEXT_CHUNKS,
        "max_context_tokens": settings.MAX_CONTEXT_TOKENS,
        "min_retrieval_score": settings.MIN_RETRIEVAL_SCORE,
        "min_rerank_score": settings.MIN_RERANK_SCORE,
        "max_audio_seconds": settings.MAX_AUDIO_SECONDS
    }


@router.get("/api/languages")
async def get_supported_languages():
    """Returns the centralized catalog of all 15 supported languages and dataset mappings."""
    from backend.languages import DATASET_LANGUAGE_MAP
    return {"languages": DATASET_LANGUAGE_MAP}


@router.post("/api/translate-ui")
async def handle_translate_ui(payload: Dict[str, Any]):
    """
    Translates UI strings on the backend using Google Translator without exposing credentials.
    Request body: { sourceLanguage: "en", targetLanguage: "mr", keys: { "app.title": "..." } }
    """
    from backend.translation import translate_ui_keys
    source_lang = payload.get("sourceLanguage", "en")
    target_lang = payload.get("targetLanguage", "hi")
    keys_dict = payload.get("keys", {})

    if not keys_dict:
        return {"translations": {}}

    translations = translate_ui_keys(keys_dict, target_lang=target_lang, source_lang=source_lang)
    return {"translations": translations}


@router.post("/api/text-to-speech")
async def handle_text_to_speech(req: TTSRequest):
    """
    Synthesizes speech from input text and language using Sarvam Bulbul v3 TTS API.
    Returns raw binary audio file (WAV) so it can be streamed/played in frontend.
    """
    import base64
    from backend.tts import sarvam_tts_service

    base64_audio, err = await sarvam_tts_service.text_to_speech(
        text=req.text,
        language_code=req.language,
        speaker=req.speaker or "shubh"
    )

    if err:
        # Return HTTP 400 with details so frontend can trigger native SpeechSynthesis fallback
        raise HTTPException(status_code=400, detail=err)

    try:
        audio_data = base64.b64decode(base64_audio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to decode audio: {str(e)}")

    return Response(content=audio_data, media_type="audio/wav")


