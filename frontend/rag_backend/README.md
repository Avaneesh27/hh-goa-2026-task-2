# HH Goa Deterministic Voice RAG Backend

This service implements a **non-generative, evidence-first RAG pipeline**. Audio is transcribed by Sarvam on the server boundary. The query is then searched against local dense and lexical indexes, fused with reciprocal-rank fusion, reranked locally, and answered only by extracting an existing sentence from retrieved evidence. When the corpus does not support an answer, the API abstains rather than generating a response.

| Component | Responsibility | External model/API use |
|---|---|---|
| Sarvam STT | Audio to transcript | Sarvam API; server secret only |
| Dense retrieval | Multilingual semantic candidates | Local sentence-transformer |
| Lexical retrieval | Exact-term and code-mixed candidates | Local SQLite FTS5/BM25 |
| Fusion | Candidate combination | Deterministic reciprocal-rank fusion |
| Reranking | Top-candidate ordering | Local cross-encoder, deterministic fallback on failure |
| Answering | Sentence selection and citations | Extractive only; no LLM |

## Dedicated-server baseline

The full 11.45M-row requested corpus requires a dedicated machine because the application-hosting runtime cannot hold the index. The initial single-node baseline is **32 GiB RAM, 500 GiB fast persistent SSD, and 8 vCPUs**. The ingestion command is resumable; it should be allowed to complete before the public API is opened. The vector database is bound only to loopback, while the API should be placed behind an HTTPS reverse proxy.

## Installation

Install Docker Engine, Docker Compose, and `rsync` on the dedicated Ubuntu server. Copy this `rag_backend/` directory to `/opt/hh-goa-voice-rag/rag_backend/`, then create the `.env` file described in [`ENVIRONMENT.md`](ENVIRONMENT.md). Do not expose the vector-database ports to the public internet.

```bash
cd /opt/hh-goa-voice-rag/rag_backend
sudo systemctl daemon-reload
sudo systemctl enable --now hh-rag-api.service
curl http://127.0.0.1:8080/health
```

## Full-corpus ingestion

The full index command intentionally uses the official Parquet source and no row cap. It streams all fourteen training shards in bounded record batches, avoiding the source dataset’s oversized Parquet row groups. A durable SQLite checkpoint is written after each successful batch. It may be safely restarted after a server or network interruption.

```bash
sudo systemctl start hh-rag-ingest.service
sudo journalctl -u hh-rag-ingest.service -f

# Inspect every configuration's durable progress and rejects.
docker compose run --rm ingest python -m app.ingest --status
```

Each source row is either processed or recorded in the persistent `rejects` table with its configuration, split, row offset, and reason. Investigate those records before declaring the corpus complete. A restart resumes from the last committed source offset; it does not begin again at row zero.

## Preflight, recovery, and snapshots

Run the model/index preflight before starting a new full index. It verifies the local embedding dimension against the named `dense` vector in Qdrant.

```bash
docker compose run --rm ingest python -m app.preflight
```

For a Qdrant snapshot after a completed configuration or full run, issue the snapshot API through the loopback port and copy the resulting snapshot to durable backup storage. During restoration, provision extra disk headroom because vector stores need temporary working space for recovery.

```bash
curl -X POST http://127.0.0.1:6333/collections/msmarco_xi_passages_v1/snapshots
```

## API contract

| Endpoint | Input | Output |
|---|---|---|
| `GET /health` | None | Index and embedding configuration readiness. |
| `POST /v1/query/text` | `{ "query": "…", "language_hint": "hi" }` | Extractive answer or abstention with citations. |
| `POST /v1/query/voice` | Multipart `audio` and optional `language_hint` | Sarvam transcript followed by the same evidence-only answer contract. |

`answered` results include direct-source citations. `abstained` results indicate that evidence was insufficient. `unavailable` indicates that the retrieval service or collection is not ready, rather than falsely implying there is no answer.

## Validation benchmark

After full indexing, run the benchmark against real labeled validation records. It measures whether the top three retrieved citations contain a passage selected by the dataset, how often the system answers or abstains, mean query latency, and the same figures broken down by language. It does not use generated answers as an evaluation proxy.

```bash
docker compose run --rm ingest python -m app.benchmark --rows-per-shard 50
```

## Windows RTX 4050 submission mode

For a constrained submission machine, `windows/Start-Submission.ps1` uses CUDA if available, limits CPU library threads to roughly 75% of logical cores, and refuses to continue once less than 12 GiB remain on the target drive. It first indexes 1,000 real source rows and reports measured index growth, throughput, and a conservative per-shard recommendation for the 50 GB budget. Use that measurement to set `SUBMISSION_ROWS_PER_SHARD` before starting the capped run. This mode is deliberately **not** the every-row corpus build; it is the largest guarded local run that fits the stated 50 GB budget. The complete all-row command remains the regular `app.ingest --source parquet` path on hardware with adequate storage.
