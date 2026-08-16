# System Architecture Specification — HH Goa 2026 Voice RAG

## 1. High-Level System Architecture

The Voice-Enabled RAG System is engineered as a **deterministic, modular pipeline** with strict separation of concerns, zero dynamic agentic prompt loops, and high-performance hybrid retrieval.

```mermaid
graph TD
    subgraph Client ["Frontend (Next.js 14 / React)"]
        UI[Web UI Dashboard]
        Mic[Web Audio API / MediaRecorder]
        TraceView[Execution Trace & Latency Breakdown]
    end

    subgraph Gateway ["FastAPI Gateway"]
        EndpointVoice["POST /api/voice/query"]
        EndpointText["POST /api/text/query"]
        HealthEndpoint["GET /health"]
    end

    subgraph STTLayer ["Speech Recognition Layer"]
        Sarvam["Sarvam STT API (saarika:v2)"]
    end

    subgraph CoreEngine ["Deterministic Core RAG Orchestrator"]
        QP["Deterministic Query Processor"]
        SG["Guardrail 1: Safety & Malicious Intent Guard"]
        Hybrid["Hybrid Search (Dense + BM25)"]
        RRF["Reciprocal Rank Fusion (k=60)"]
        RG["Guardrail 2: Relevance Threshold Guard"]
        Rerank["Cross-Encoder Reranker (Top 20 -> Top 5)"]
        RCG["Guardrail 2b: Rerank Confidence Guard"]
        CtxSel["Context Selector & Deduplication"]
        LLM["Grounded LLM Generator (Gemini/Groq/Ollama/Local)"]
        GG["Guardrail 3: Grounding Claim Verification"]
        AbstainHandler["Guardrail 4: Explicit Multilingual Abstention"]
    end

    subgraph DataLayer ["Data & Index Storage"]
        Qdrant[("Qdrant Vector DB (HNSW Cosine)")]
        BM25Idx[("Multilingual BM25 Inverted Index")]
        MSMARCO[("AI4Bharat MSMARCO-XI Corpus")]
    end

    Mic -->|Audio WAV/WebM| EndpointVoice
    UI -->|Text Query| EndpointText
    EndpointVoice --> Sarvam
    Sarvam -->|Transcript + Lang| QP
    EndpointText --> QP

    QP --> SG
    SG -- Unsafe --> AbstainHandler
    SG -- Safe --> Hybrid

    Hybrid -->|Dense Embed| Qdrant
    Hybrid -->|Keyword Tokens| BM25Idx
    Qdrant --> RRF
    BM25Idx --> RRF

    RRF --> RG
    RG -- Weak Score --> AbstainHandler
    RG -- Passed --> Rerank
    Rerank --> RCG
    RCG -- Irrelevant --> AbstainHandler
    RCG -- Confident --> CtxSel

    CtxSel --> LLM
    LLM --> GG
    GG -- Grounded --> TraceView
    GG -- Ungrounded --> AbstainHandler
    AbstainHandler --> TraceView
```

---

## 2. Ingestion Pipeline Architecture

The ingestion pipeline (`ingestion/run_ingestion.py`) runs offline and precomputes all document representations:

```mermaid
sequenceDiagram
    participant HF as AI4Bharat MSMARCO-XI
    participant Cln as TextCleaner (NFKC & HTML Strip)
    participant Chk as Adaptive Chunker (5 Strategies)
    participant Emb as EmbeddingManager (paraphrase-multilingual)
    participant Qdr as Qdrant Vector DB
    participant BM as BM25SearchEngine

    HF->>Cln: Raw records (14 Indic languages & English)
    Cln->>Cln: Clean HTML, normalize Unicode, strip URLs, assign deterministic doc IDs
    Cln->>Chk: Cleaned Documents
    Chk->>Chk: Generate Sentence-Aware, Structural, Sliding & Hierarchical Chunks
    Chk->>Emb: Unique Chunk Texts (Batches of 64/128)
    Emb->>Emb: Precompute normalized dense vector embeddings
    Emb->>Qdr: Upsert Points (Vectors + Full Payload Metadata)
    Chk->>BM: Tokenize Corpus with Multilingual Word Regex & Stopwords
    BM->>BM: Compile & serialize BM25 index (data/bm25_index.pkl)
```

---

## 3. Retrieval & Candidate Fusion Flow

1. **Query Embedding ($O(1)$ warm cache)**:
   - Evaluated using `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`.
   - In-memory LRU query cache prevents redundant computation on repeated queries.
2. **Dense Vector Search (Qdrant)**:
   - Approximate Nearest Neighbors (ANN) with Cosine similarity on HNSW graph.
   - Retrieves `dense_top_k = 20` candidates.
3. **Sparse Keyword Search (BM25)**:
   - Multilingual tokenization over 14 Indic scripts + English.
   - Exact term matches, numbers, proper nouns, and technical acronyms.
   - Retrieves `bm25_top_k = 20` candidates.
4. **Reciprocal Rank Fusion (RRF)**:
   $$RRF(d) = \sum_{m \in \{\text{dense}, \text{bm25}\}} \frac{1}{k + \text{rank}_m(d)} \quad (k=60)$$
   - Fuses dense and sparse rankings into a unified list of 20 candidates.
5. **Cross-Encoder Reranking**:
   - `BAAI/bge-reranker-base` evaluates pairwise relevance $(q, d_i)$ to re-score and select the top 5 high-confidence evidence chunks.

---

## 4. Guardrail State Machine & Abstention Logic

The system strictly adheres to deterministic verification before returning any answer:

```mermaid
stateDiagram-v2
    [*] --> SafetyCheck
    SafetyCheck --> UnsafeAbstain: Malicious pattern matched
    SafetyCheck --> HybridRetrieval: Query safe

    HybridRetrieval --> RelevanceCheck
    RelevanceCheck --> LowScoreAbstain: Fused RRF score < 0.012
    RelevanceCheck --> Reranking: Retrieval passed

    Reranking --> ConfidenceCheck
    ConfidenceCheck --> IrrelevantAbstain: Reranker raw score < 0.70 / score < 0.65
    ConfidenceCheck --> ContextSelection: High confidence evidence

    ContextSelection --> GroundedGeneration: Token budget enforced
    GroundedGeneration --> GroundingVerification

    GroundingVerification --> FinalAnswer: Claim overlap >= 35%
    GroundingVerification --> RetryGeneration: Claim overlap < 35%
    RetryGeneration --> GroundingVerification2
    GroundingVerification2 --> FinalAnswer: Retry passed
    GroundingVerification2 --> UngroundedAbstain: Retry failed

    UnsafeAbstain --> [*]
    LowScoreAbstain --> [*]
    IrrelevantAbstain --> [*]
    UngroundedAbstain --> [*]
    FinalAnswer --> [*]
```

---

## 5. Latency Engineering Strategies

To achieve sub-200ms RAG operations:
1. **Precomputed Offline Embeddings**: Document embeddings are precalculated during ingestion. Runtime only computes the 1 query vector.
2. **In-Memory Query Embedding Cache**: LRU cache stores query vectors for sub-millisecond query embedding retrieval ($<0.1$ ms).
3. **Local In-Memory BM25**: Pre-compiled inverted index serialized on disk and loaded into RAM on startup (BM25 search latency $<15$ ms).
4. **Model Lifespan Pre-Warming**: FastAPI lifespan loads PyTorch models and BM25 into memory on boot, eliminating first-request cold starts.
5. **High-Precision Monotonic Timing**: All stage durations are measured via `time.perf_counter()`.
