# API Reference — HH Goa 2026 Voice-Enabled RAG

The Voice-Enabled RAG backend exposes a high-performance REST API built with FastAPI.

Base URL: `http://localhost:8000`

---

## 1. Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status, database connection, and indexed chunk counts |
| `POST` | `/api/text/query` | Plain-text query through the full deterministic RAG pipeline |
| `POST` | `/api/voice/query` | Audio file upload (WAV/WebM/MP3) $\to$ Sarvam STT $\to$ RAG pipeline |
| `GET` | `/api/metrics` | Real-time aggregated latency percentiles and query statistics |
| `GET` | `/api/config` | Public sanitized configuration parameters and thresholds |

---

## 2. Detailed Endpoint Documentation

### `POST /api/text/query`
Executes hybrid retrieval, reranking, and grounded generation for a text prompt.

#### Request Body
```json
{
  "query": "कॉर्पोरेशन क्या है?",
  "language": "hi",
  "filter_language": "hi"
}
```

#### Response Payload (`200 OK`)
```json
{
  "request_id": "6a96e987-987a-4c28-98e3-0ecdf7918a55",
  "transcript": "कॉर्पोरेशन क्या है?",
  "language": "hi",
  "answer": "एक कंपनी एक विशिष्ट देश में निगमित होती है... निगम तब उस राज्य में निगमन के कानूनों द्वारा शासित होता है। [1]",
  "confidence": 0.92,
  "grounded": true,
  "abstained": false,
  "abstention_reason": null,
  "retrieval": {
    "strategy": "hybrid",
    "dense_count": 20,
    "bm25_count": 20,
    "fused_count": 20,
    "reranked_count": 5,
    "selected_count": 5
  },
  "evidence": [
    {
      "citation_id": "[1]",
      "chunk_id": "doc_1102432_0_hi_sent_0",
      "document_id": "doc_1102432_0_hi",
      "text": "एक कंपनी एक विशिष्ट देश में निगमित होती है...",
      "language": "hi",
      "score": 0.731
    }
  ],
  "latency": {
    "stt_ms": 0.0,
    "query_processing_ms": 0.08,
    "embedding_ms": 20.16,
    "dense_retrieval_ms": 34.01,
    "bm25_ms": 16.03,
    "fusion_ms": 0.10,
    "reranking_ms": 18.50,
    "context_selection_ms": 0.05,
    "generation_ms": 0.01,
    "guardrails_ms": 0.14,
    "total_rag_ms": 89.08,
    "end_to_end_ms": 89.08
  },
  "execution_trace": [
    "✓ Language detected: HI (definition intent)",
    "✓ Query normalized & 2 keywords extracted",
    "✓ Safety checks passed",
    "✓ Hybrid search complete (Dense: 20, BM25: 20)",
    "✓ Reciprocal Rank Fusion complete (20 candidates)",
    "✓ Relevance threshold confirmed",
    "✓ Multilingual reranker filtered to Top 5 evidence chunks",
    "✓ Selected 5 non-redundant evidence passages (309 words)",
    "✓ Grounding verified (Score: 1.00)",
    "✓ Final answer generated (deterministic_extractive)"
  ]
}
```

---

### `POST /api/voice/query`
Accepts multipart audio form upload.

#### Request Form Data
- `file`: Binary audio stream (`audio/wav`, `audio/webm`, `audio/mp4`)
- `language` *(optional)*: Language hint code (`hi`, `en`, `bn`, `ta`, `te`, etc.)

#### cURL Example
```bash
curl -X POST "http://localhost:8000/api/voice/query" \
  -F "file=@recording.wav" \
  -F "language=hi"
```

---

### `GET /health`
Returns system status.

```json
{
  "status": "healthy",
  "timestamp": "2026-08-16 10:00:00 UTC",
  "dataset_collection": "msmarco_hindi_english",
  "indexed_chunks": 10696,
  "embedding_model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
  "reranker_model": "BAAI/bge-reranker-base",
  "llm_provider": "gemini",
  "llm_model": "gemini-1.5-flash"
}
```
