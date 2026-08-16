# Latency Benchmark Report — HH Goa 2026 Voice RAG

**Total Queries Tested**: `162`  
**Timestamp**: `2026-08-16 09:58:39 UTC`  
**Benchmark Runtime**: `310.35s`  
**Grounded Answers**: `83` | **Abstained Answers**: `79`  

## Component Latency Breakdown & Percentiles (in milliseconds)

| Component Stage | Min | P50 (Median) | P70 | P90 | P95 | P99 | P100 (Max) | Mean |
|---|---|---|---|---|---|---|---|---|
| Query Processing | 0.05 ms | **0.08 ms** | **0.09 ms** | 0.12 ms | 0.13 ms | 0.2 ms | **0.33 ms** | 0.09 ms |
| Embedding (Query) | 0.02 ms | **20.16 ms** | **27.86 ms** | 37.41 ms | 40.32 ms | 94.21 ms | **217.93 ms** | 24.82 ms |
| Dense Vector Search | 18.85 ms | **34.01 ms** | **38.89 ms** | 54.0 ms | 61.11 ms | 65.2 ms | **71.31 ms** | 35.66 ms |
| BM25 Keyword Search | 4.72 ms | **16.03 ms** | **20.54 ms** | 27.69 ms | 31.43 ms | 38.0 ms | **38.2 ms** | 17.62 ms |
| RRF Candidate Fusion | 0.06 ms | **0.1 ms** | **0.11 ms** | 0.14 ms | 0.16 ms | 0.17 ms | **0.19 ms** | 0.1 ms |
| Cross-Encoder Reranking | 655.91 ms | **1554.56 ms** | **1889.46 ms** | 2286.96 ms | 3080.54 ms | 4463.95 ms | **6669.94 ms** | 1710.84 ms |
| Context Selection & Dedup | 0.0 ms | **0.05 ms** | **0.09 ms** | 0.13 ms | 0.14 ms | 0.16 ms | **0.17 ms** | 0.05 ms |
| Grounded Generation | 0.0 ms | **0.01 ms** | **0.02 ms** | 0.03 ms | 0.03 ms | 0.04 ms | **0.04 ms** | 0.01 ms |
| Guardrails & Verification | 0.0 ms | **0.14 ms** | **0.25 ms** | 0.37 ms | 0.43 ms | 0.54 ms | **0.86 ms** | 0.15 ms |
| **Total RAG Latency** | 696.96 ms | **1631.49 ms** | **1974.43 ms** | 2381.49 ms | 3164.28 ms | 4527.7 ms | **6733.4 ms** | 1789.34 ms |
| **End-to-End Latency** | 697.08 ms | **1631.61 ms** | **1974.59 ms** | 2381.67 ms | 3164.39 ms | 4527.82 ms | **6733.57 ms** | 1789.48 ms |

