# Required Server Environment

Create `/opt/hh-goa-voice-rag/rag_backend/.env` directly on the dedicated server. Do not commit it or copy it into source control.

| Variable | Required | Purpose |
|---|---:|---|
| `SARVAM_API_KEY` | Yes | Server-only Sarvam STT credential. |
| `SARVAM_BASE_URL` | No | Defaults to `https://api.sarvam.ai`. |
| `SARVAM_STT_MODEL` | No | Defaults to `saaras:v3`. |
| `QDRANT_URL` | No | Uses the private Docker service by default. |
| `QDRANT_COLLECTION` | No | Defaults to `msmarco_xi_passages_v1`. |
| `LEXICAL_DB_PATH` | No | Defaults to `/var/lib/hh-rag/lexical.sqlite3`. |
| `EMBEDDING_MODEL` | No | Local multilingual sentence-transformer model. |
| `RERANKER_MODEL` | No | Local cross-encoder reranker. |
| `EMBEDDING_DIMENSIONS` | No | Must match the local embedding model; default is `384`. |
| `ALLOWED_ORIGINS` | Yes | Comma-separated public origins allowed to call the RAG API. |

The only credential used by this service is the Sarvam STT key. Dense embedding, lexical retrieval, reranking, and answer extraction run locally. No text-generation API or hosted LLM credential is used.
