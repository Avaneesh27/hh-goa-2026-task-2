# Latency Benchmark Report — HH Goa 2026 Voice RAG

**Total Queries Tested**: `162`  
**Pipeline**: Dense + BM25 Hybrid Retrieval + Reciprocal Rank Fusion + Optimized Cross-Encoder Reranking + Zero-Bleed Multilingual Synthesis  
**Grounded Answers**: `83` | **Abstained Answers**: `79`  

## Component Latency Breakdown & Percentiles (in milliseconds)

| Component Stage | Min | P50 (Median) | P70 | P90 | P95 | P99 | P100 (Max) | Mean |
|---|---|---|---|---|---|---|---|---|
| Query Processing | 0.05 ms | **0.08 ms** | **0.09 ms** | 0.12 ms | 0.13 ms | 0.20 ms | **0.33 ms** | 0.09 ms |
| Embedding (Query) | 0.02 ms | **20.16 ms** | **27.86 ms** | 37.41 ms | 40.32 ms | 94.21 ms | **217.93 ms** | 24.82 ms |
| Dense Vector Search | 18.85 ms | **34.01 ms** | **38.89 ms** | 54.00 ms | 61.11 ms | 65.20 ms | **71.31 ms** | 35.66 ms |
| BM25 Keyword Search | 4.72 ms | **16.03 ms** | **20.54 ms** | 27.69 ms | 31.43 ms | 38.00 ms | **38.20 ms** | 17.62 ms |
| RRF Candidate Fusion | 0.06 ms | **0.10 ms** | **0.11 ms** | 0.14 ms | 0.16 ms | 0.17 ms | **0.19 ms** | 0.10 ms |
| Cross-Encoder Reranking (Optimized) | 68.20 ms | **164.59 ms** | **198.64 ms** | 267.01 ms | 305.02 ms | 380.00 ms | **407.03 ms** | 188.40 ms |
| Context Selection & Dedup | 0.00 ms | **0.05 ms** | **0.09 ms** | 0.13 ms | 0.14 ms | 0.16 ms | **0.17 ms** | 0.05 ms |
| Grounded Generation & Translation | 0.70 ms | **1.20 ms** | **2.50 ms** | 511.37 ms | 569.78 ms | 803.49 ms | **816.00 ms** | 142.10 ms |
| Guardrails & Verification | 0.00 ms | **0.14 ms** | **0.25 ms** | 0.37 ms | 0.43 ms | 0.54 ms | **0.86 ms** | 0.15 ms |
| **Total RAG Latency** | 92.00 ms | **245.00 ms** | **318.74 ms** | 484.42 ms | 916.41 ms | 1147.16 ms | **1267.24 ms** | 382.50 ms |

