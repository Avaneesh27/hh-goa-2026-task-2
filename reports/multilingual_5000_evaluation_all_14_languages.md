# Massive Multilingual 5,000+ Test Evaluation Report (Offset: 0)

**Model**: `models/msmarco-xi-multilingual-biencoder`  
**Device**: `CUDA`  
**Dataset Slice Offset**: `0` (Distinct Test Samples)  
**Total Automated Test Executions**: `75,000` tests  
**Total Suite Duration**: `3897.33s`  
**Completed Timestamp**: `2026-08-18 14:33:59 UTC`  

## 1. Executive Summary & Macro Performance Across Languages

| Metric Dimension | Benchmark Result | Evaluation Standard |
| --- | --- | --- |
| **Top-1 Retrieval (Recall@1)** | **91.87%** | Exact top-1 passage match |
| **Top-5 Retrieval (Recall@5)** | **99.97%** | Top-5 passage candidate pool |
| **Mean Reciprocal Rank (MRR@10)** | **0.9501** | Ranking quality |
| **Answer Semantic Similarity** | **0.5637** | Cosine similarity vs MS MARCO Ground Truth |
| **Token Overlap F1** | **32.58%** | Keyword & terminology preservation |
| **Faithfulness & Grounding** | **87.7%** | Evidence-supported response rate |
| **End-to-End Latency (p50)** | **15.48 ms** | Median response time |
| **End-to-End Latency (p95)** | **390.98 ms** | 95th percentile latency |
| **End-to-End Latency (p99)** | **675.95 ms** | 99th percentile worst-case latency |

## 2. Per-Language 5,000+ Test Evaluation Breakdown

| Language | Tests | Recall@1 | Recall@5 | MRR@10 | Semantic Sim | Token F1 | Faithfulness | E2E p50 (ms) | E2E p95 (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Hindi** | 5,000 | 94.24% | 99.98% | 0.9652 | 0.4637 | 28.71% | 76.34% | 18.47ms | 621.23ms |
| **Bengali** | 5,000 | 92.44% | 99.96% | 0.9537 | 0.5404 | 31.16% | 86.72% | 18.34ms | 22.12ms |
| **Marathi** | 5,000 | 93.74% | 99.96% | 0.9626 | 0.5109 | 27.88% | 80.44% | 18.27ms | 22.4ms |
| **Tamil** | 5,000 | 88.66% | 99.88% | 0.9279 | 0.602 | 31.86% | 90.34% | 19.71ms | 673.42ms |
| **Telugu** | 5,000 | 91.78% | 99.98% | 0.9494 | 0.6159 | 34.51% | 93.64% | 18.95ms | 612.04ms |
| **Gujarati** | 5,000 | 92.58% | 99.98% | 0.9547 | 0.5864 | 35.8% | 94.02% | 18.69ms | 610.05ms |
| **Kannada** | 5,000 | 91.78% | 99.98% | 0.9489 | 0.5865 | 30.53% | 93.5% | 18.86ms | 627.72ms |
| **Malayalam** | 5,000 | 91.72% | 99.94% | 0.9493 | 0.5701 | 29.05% | 93.5% | 18.86ms | 624.49ms |
| **Punjabi** | 5,000 | 91.24% | 100.0% | 0.947 | 0.5853 | 40.08% | 92.62% | 18.67ms | 614.48ms |
| **Odia** | 5,000 | 90.34% | 99.98% | 0.9397 | 0.5651 | 31.15% | 91.66% | 18.32ms | 618.93ms |
| **Assamese** | 5,000 | 90.86% | 99.96% | 0.9443 | 0.5297 | 30.53% | 82.12% | 10.14ms | 396.65ms |
| **Nepali** | 5,000 | 92.96% | 99.96% | 0.9574 | 0.5577 | 33.11% | 84.28% | 8.2ms | 11.98ms |
| **Sanskrit** | 5,000 | 85.92% | 99.94% | 0.9119 | 0.3933 | 17.1% | 67.36% | 9.23ms | 18.45ms |
| **Urdu** | 5,000 | 91.98% | 99.98% | 0.9509 | 0.6518 | 38.05% | 91.12% | 9.0ms | 379.39ms |
| **English** | 5,000 | 97.82% | 100.0% | 0.9885 | 0.6964 | 49.13% | 97.78% | 8.46ms | 11.28ms |

## 3. Sub-System Latency Breakdown (Percentiles in ms)

| Language | Sub-System | Mean (ms) | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) |
| --- | --- | --- | --- | --- | --- | --- |
| Hindi | `embedding` | 0.67 | 0.5 | 1.66 | 1.73 | 1.84 |
| Hindi | `retrieval` | 17.64 | 17.88 | 23.22 | 26.2 | 35.58 |
| Hindi | `generation` | 60.04 | 0.28 | 0.63 | 601.89 | 875.45 |
| Hindi | `end_to_end` | 77.7 | 18.47 | 38.05 | 621.23 | 895.52 |
| Bengali | `embedding` | 0.53 | 0.42 | 1.41 | 1.46 | 1.52 |
| Bengali | `retrieval` | 18.29 | 18.1 | 20.44 | 21.88 | 24.71 |
| Bengali | `generation` | 0.23 | 0.22 | 0.32 | 0.36 | 0.44 |
| Bengali | `end_to_end` | 18.53 | 18.34 | 20.68 | 22.12 | 24.97 |
| Marathi | `embedding` | 0.57 | 0.4 | 1.53 | 1.58 | 1.65 |
| Marathi | `retrieval` | 18.28 | 18.0 | 20.74 | 22.1 | 25.08 |
| Marathi | `generation` | 0.26 | 0.25 | 0.35 | 0.4 | 0.52 |
| Marathi | `end_to_end` | 18.55 | 18.27 | 21.02 | 22.4 | 25.35 |
| Tamil | `embedding` | 0.81 | 0.69 | 1.58 | 1.99 | 2.59 |
| Tamil | `retrieval` | 21.16 | 19.05 | 27.82 | 32.51 | 47.1 |
| Tamil | `generation` | 73.97 | 0.24 | 0.59 | 650.11 | 964.83 |
| Tamil | `end_to_end` | 95.15 | 19.71 | 52.84 | 673.42 | 987.99 |
| Telugu | `embedding` | 0.64 | 0.52 | 1.02 | 1.37 | 3.14 |
| Telugu | `retrieval` | 19.73 | 18.56 | 24.56 | 27.25 | 36.09 |
| Telugu | `generation` | 46.43 | 0.23 | 0.39 | 592.5 | 915.41 |
| Telugu | `end_to_end` | 66.19 | 18.95 | 29.01 | 612.04 | 935.24 |
| Gujarati | `embedding` | 0.68 | 0.56 | 1.44 | 1.57 | 1.83 |
| Gujarati | `retrieval` | 19.4 | 18.33 | 23.69 | 26.12 | 35.1 |
| Gujarati | `generation` | 42.69 | 0.23 | 0.37 | 592.3 | 910.31 |
| Gujarati | `end_to_end` | 62.11 | 18.69 | 26.66 | 610.05 | 931.75 |
| Kannada | `embedding` | 0.64 | 0.52 | 1.24 | 1.45 | 1.79 |
| Kannada | `retrieval` | 20.22 | 18.44 | 25.31 | 29.73 | 46.71 |
| Kannada | `generation` | 50.41 | 0.23 | 0.38 | 606.62 | 926.3 |
| Kannada | `end_to_end` | 70.64 | 18.86 | 33.58 | 627.72 | 950.45 |
| Malayalam | `embedding` | 0.68 | 0.5 | 1.45 | 1.77 | 2.23 |
| Malayalam | `retrieval` | 20.0 | 18.45 | 24.77 | 28.87 | 43.32 |
| Malayalam | `generation` | 48.7 | 0.23 | 0.38 | 604.16 | 914.46 |
| Malayalam | `end_to_end` | 68.72 | 18.86 | 31.14 | 624.49 | 933.75 |
| Punjabi | `embedding` | 0.69 | 0.54 | 1.46 | 1.69 | 2.28 |
| Punjabi | `retrieval` | 19.64 | 18.3 | 24.15 | 27.73 | 40.42 |
| Punjabi | `generation` | 46.12 | 0.24 | 0.39 | 594.62 | 924.71 |
| Punjabi | `end_to_end` | 65.77 | 18.67 | 28.97 | 614.48 | 944.85 |
| Odia | `embedding` | 0.99 | 0.66 | 1.95 | 2.42 | 3.4 |
| Odia | `retrieval` | 17.93 | 17.9 | 24.47 | 28.67 | 40.04 |
| Odia | `generation` | 54.63 | 0.21 | 0.38 | 601.5 | 999.26 |
| Odia | `end_to_end` | 72.58 | 18.32 | 32.3 | 618.93 | 1017.22 |
| Assamese | `embedding` | 0.62 | 0.49 | 1.31 | 1.38 | 1.45 |
| Assamese | `retrieval` | 11.27 | 9.74 | 16.77 | 19.56 | 27.54 |
| Assamese | `generation` | 39.07 | 0.14 | 0.22 | 385.85 | 716.9 |
| Assamese | `end_to_end` | 50.35 | 10.14 | 22.25 | 396.65 | 727.5 |
| Nepali | `embedding` | 0.38 | 0.29 | 1.17 | 1.18 | 1.2 |
| Nepali | `retrieval` | 8.34 | 8.02 | 10.3 | 11.39 | 15.11 |
| Nepali | `generation` | 6.52 | 0.14 | 0.19 | 0.21 | 363.36 |
| Nepali | `end_to_end` | 14.87 | 8.2 | 10.73 | 11.98 | 372.8 |
| Sanskrit | `embedding` | 0.57 | 0.41 | 1.22 | 1.26 | 2.47 |
| Sanskrit | `retrieval` | 9.83 | 9.01 | 11.59 | 15.32 | 23.27 |
| Sanskrit | `generation` | 16.76 | 0.15 | 0.21 | 0.25 | 660.09 |
| Sanskrit | `end_to_end` | 26.6 | 9.23 | 13.05 | 18.45 | 670.22 |
| Urdu | `embedding` | 0.47 | 0.34 | 0.92 | 1.32 | 2.11 |
| Urdu | `retrieval` | 9.66 | 8.71 | 13.14 | 15.63 | 21.71 |
| Urdu | `generation` | 33.27 | 0.13 | 0.18 | 369.62 | 696.67 |
| Urdu | `end_to_end` | 42.94 | 9.0 | 16.52 | 379.39 | 706.53 |
| English | `embedding` | 0.26 | 0.25 | 0.37 | 0.38 | 0.5 |
| English | `retrieval` | 8.6 | 8.32 | 10.16 | 11.06 | 15.01 |
| English | `generation` | 0.14 | 0.14 | 0.18 | 0.2 | 0.24 |
| English | `end_to_end` | 8.75 | 8.46 | 10.35 | 11.28 | 15.17 |

