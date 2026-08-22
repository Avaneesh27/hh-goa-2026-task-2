# Backend Research Notes

## Reference implementation

The user’s reference repository describes a deterministic multilingual voice RAG pipeline: speech-to-text, language and intent handling, dense retrieval plus BM25, reciprocal-rank fusion, cross-encoder reranking, guardrails, and evidence-first response formatting. It uses FastAPI, Qdrant, local sentence-transformer embeddings, and a cross-encoder reranker. The new backend will preserve the retrieval and abstention principles while replacing the generative answer layer with deterministic extractive answer selection.

Source: <https://github.com/Avaneesh27/hh-goa-2026-task-2>
Reference README: <https://raw.githubusercontent.com/Avaneesh27/hh-goa-2026-task-2/main/README.md>
Reference architecture: <https://raw.githubusercontent.com/Avaneesh27/hh-goa-2026-task-2/main/ARCHITECTURE.md>

## Dataset

AI4Bharat MSMARCO-XI provides Indic-language translations of MS MARCO examples for 14 languages. Each record includes a translated query and answer, query metadata, and passages with original English and translated versions plus selection labels. The complete build must ingest every user-requested row with a resumable process and persist durable index state.

Dataset card: <https://huggingface.co/datasets/ai4bharat/MSMARCO-XI>
Dataset README: <https://huggingface.co/datasets/ai4bharat/MSMARCO-XI/raw/main/README.md>

The published dataset builder defines fourteen language configurations: `as`, `bn`, `gu`, `hi`, `kn`, `ml`, `mr`, `ne`, `or`, `pa`, `sa`, `ta`, `te`, and `ur`. A record contains `source_lang`, `target_lang`, `query`, `Answer`, `query_id`, `query_type`, `Eng_Query`, `Eng_Answer`, and a nested `passages` object containing `is_selected`, `English_passages`, and `Translated_passages`. The ingestion parser preferentially indexes `Translated_passages` under the record’s `target_lang`, while preserving row identifiers and selection labels for auditability.

Dataset builder: <https://huggingface.co/datasets/ai4bharat/MSMARCO-XI/raw/main/ms_marco_translations.py>

The official public repository currently exposes the data through a `default` dataset configuration with `train` and `validation` splits. The downloaded official Urdu validation shard contains 97,941 rows in one Parquet row group and confirms the same fields at rest: `source_lang`, `target_lang`, `Answer`, `query_id`, `query_type`, `passages.English_passages`, `passages.Translated_passages`, `passages.is_selected`, `Eng_Query`, `Eng_Answer`, and `query`. Its oversized single row group cannot be safely materialized as a one-row local sample in the current sandbox, so parser behavior is validated against the published schema and full-shard metadata, while the dedicated server will stream the actual full corpus during ingestion.

Repository inventory endpoint: <https://huggingface.co/api/datasets/ai4bharat/MSMARCO-XI/tree/main/validation?recursive=false&expand=false>

### Full-corpus storage implication

For 11,451,314 records, 384-dimensional `float32` dense vectors alone require approximately 16.38 GiB before metadata, ANN graph overhead, sparse retrieval structures, passage storage, checkpoints, and operating-system headroom. Even one-byte-per-dimension quantized vectors are approximately 4.10 GiB before those additional requirements. The complete ingestion therefore needs a durable environment with substantially more than the current application runtime’s 512 MB memory ceiling and with expandable persistent storage.

Qdrant’s planning formula adds 50% headroom for metadata, point versions, and temporary optimization segments. That makes the baseline approximately 24.57 GiB for full-precision 384-dimensional vectors, or 6.14 GiB for an int8 representation before text payloads, sparse index storage, source data, ingestion checkpoints, and operating-system headroom. The full deployment will therefore use on-disk vector and HNSW storage, Qdrant scalar quantization with test-backed recall checks, and a server sized with at least 32 GiB RAM plus 500 GiB of fast persistent SSD storage as a conservative single-node baseline. A larger configuration or distributed deployment may be required after a sampled capacity test confirms actual payload and sparse-index sizes.

Qdrant documentation: <https://qdrant.tech/documentation/capacity-planning/>
Quantization documentation: <https://qdrant.tech/documentation/manage-data/quantization/>

### Corrected passage-level upper bound

Each row contains an array of passages. The published schema and a real Urdu validation record both show ten translated passages per row. Before deduplication, 11,451,314 rows therefore imply as many as 114,513,140 candidate passage vectors. At 384 dimensions, the dense vectors alone are approximately 40.95 GiB using int8 storage or 163.81 GiB using float32. Applying Qdrant’s 50% capacity headroom produces approximate vector-only baselines of 61.42 GiB and 245.71 GiB respectively, before textual payloads, the lexical index, source shards, HNSW structures, snapshots, models, checkpoint state, and operating-system headroom. Deduplication will reduce the final count, but it cannot be assumed in advance; a 400 GB local disk is therefore not a safe full-corpus target.

## Sarvam STT

Sarvam’s current REST endpoint is `POST https://api.sarvam.ai/speech-to-text`. Authentication is server-side via the `api-subscription-key` request header and requires multipart audio upload. For new integrations, `saaras:v3` is the recommended model; `mode=transcribe` preserves the spoken language while `mode=codemix` supports code-mixed output. REST is for audio under 30 seconds; longer recordings require batch or streaming modes.

Documentation: <https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/overview>
API reference: <https://docs.sarvam.ai/api-reference/speech-to-text/transcribe>
