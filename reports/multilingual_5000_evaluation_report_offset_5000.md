# Massive Multilingual 5,000+ Test Evaluation Report (Offset: 5,000)

**Model**: `models/msmarco-xi-multilingual-biencoder`  
**Device**: `CUDA`  
**Dataset Slice Offset**: `5,000` (Distinct Test Samples)  
**Total Automated Test Executions**: `35,000` tests  
**Total Suite Duration**: `1104.51s`  
**Completed Timestamp**: `2026-08-18 12:17:19 UTC`  

## 1. Executive Summary & Macro Performance Across Languages

| Metric Dimension | Benchmark Result | Evaluation Standard |
| --- | --- | --- |
| **Top-1 Retrieval (Recall@1)** | **94.01%** | Exact top-1 passage match |
| **Top-5 Retrieval (Recall@5)** | **99.97%** | Top-5 passage candidate pool |
| **Mean Reciprocal Rank (MRR@10)** | **0.9645** | Ranking quality |
| **Answer Semantic Similarity** | **0.6139** | Cosine similarity vs MS MARCO Ground Truth |
| **Token Overlap F1** | **32.64%** | Keyword & terminology preservation |
| **Faithfulness & Grounding** | **89.57%** | Evidence-supported response rate |
| **End-to-End Latency (p50)** | **12.8 ms** | Median response time |
| **End-to-End Latency (p95)** | **197.34 ms** | 95th percentile latency |
| **End-to-End Latency (p99)** | **361.8 ms** | 99th percentile worst-case latency |

## 2. Per-Language 5,000+ Test Evaluation Breakdown

| Language | Tests | Recall@1 | Recall@5 | MRR@10 | Semantic Sim | Token F1 | Faithfulness | E2E p50 (ms) | E2E p95 (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Hindi** | 5,000 | 94.6% | 99.98% | 0.9683 | 0.5072 | 29.47% | 79.42% | 16.17ms | 583.42ms |
| **Bengali** | 5,000 | 93.42% | 99.92% | 0.9608 | 0.5698 | 29.28% | 85.5% | 18.35ms | 20.88ms |
| **Marathi** | 5,000 | 94.44% | 99.96% | 0.9675 | 0.559 | 26.33% | 80.02% | 18.6ms | 20.71ms |
| **Tamil** | 5,000 | 90.94% | 99.96% | 0.9445 | 0.608 | 30.21% | 92.94% | 9.58ms | 378.96ms |
| **Telugu** | 5,000 | 92.88% | 99.96% | 0.9571 | 0.6467 | 32.87% | 94.98% | 9.23ms | 347.23ms |
| **Gujarati** | 5,000 | 94.04% | 99.98% | 0.965 | 0.6446 | 33.61% | 95.74% | 9.14ms | 19.03ms |
| **English** | 5,000 | 97.72% | 100.0% | 0.9882 | 0.7623 | 46.74% | 98.4% | 8.52ms | 11.12ms |

## 3. Sub-System Latency Breakdown (Percentiles in ms)

| Language | Sub-System | Mean (ms) | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) |
| --- | --- | --- | --- | --- | --- | --- |
| Hindi | `embedding` | 0.66 | 0.46 | 1.48 | 1.62 | 1.96 |
| Hindi | `retrieval` | 14.47 | 13.82 | 21.35 | 24.72 | 31.5 |
| Hindi | `generation` | 49.73 | 0.22 | 0.51 | 561.92 | 697.8 |
| Hindi | `end_to_end` | 64.22 | 16.17 | 32.04 | 583.42 | 711.22 |
| Bengali | `embedding` | 0.51 | 0.39 | 1.31 | 1.4 | 1.42 |
| Bengali | `retrieval` | 16.65 | 18.11 | 19.61 | 20.6 | 23.44 |
| Bengali | `generation` | 0.22 | 0.21 | 0.31 | 0.35 | 0.44 |
| Bengali | `end_to_end` | 16.88 | 18.35 | 19.86 | 20.88 | 23.67 |
| Marathi | `embedding` | 0.5 | 0.38 | 0.98 | 1.41 | 1.59 |
| Marathi | `retrieval` | 18.27 | 18.34 | 19.46 | 20.39 | 23.54 |
| Marathi | `generation` | 0.25 | 0.25 | 0.34 | 0.38 | 0.46 |
| Marathi | `end_to_end` | 18.54 | 18.6 | 19.76 | 20.71 | 23.78 |
| Tamil | `embedding` | 0.43 | 0.35 | 0.6 | 0.83 | 1.37 |
| Tamil | `retrieval` | 11.28 | 9.26 | 18.67 | 21.39 | 29.5 |
| Tamil | `generation` | 33.67 | 0.15 | 0.28 | 369.15 | 650.2 |
| Tamil | `end_to_end` | 44.97 | 9.58 | 24.43 | 378.96 | 663.93 |
| Telugu | `embedding` | 0.42 | 0.34 | 0.65 | 0.9 | 1.27 |
| Telugu | `retrieval` | 9.49 | 9.01 | 12.0 | 14.45 | 20.24 |
| Telugu | `generation` | 23.16 | 0.14 | 0.21 | 338.36 | 645.46 |
| Telugu | `end_to_end` | 32.65 | 9.23 | 14.44 | 347.23 | 654.06 |
| Gujarati | `embedding` | 0.46 | 0.36 | 1.21 | 1.22 | 1.36 |
| Gujarati | `retrieval` | 9.37 | 8.94 | 11.51 | 13.68 | 19.07 |
| Gujarati | `generation` | 17.37 | 0.14 | 0.21 | 0.25 | 432.76 |
| Gujarati | `end_to_end` | 26.75 | 9.14 | 12.85 | 19.03 | 442.16 |
| English | `embedding` | 0.27 | 0.25 | 0.37 | 0.37 | 0.44 |
| English | `retrieval` | 8.55 | 8.37 | 10.07 | 10.98 | 13.65 |
| English | `generation` | 0.14 | 0.13 | 0.18 | 0.2 | 0.23 |
| English | `end_to_end` | 8.69 | 8.52 | 10.27 | 11.12 | 13.81 |

