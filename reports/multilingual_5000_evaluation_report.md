# Massive Multilingual 5,000+ Test Evaluation Report

**Model**: `models/msmarco-xi-multilingual-biencoder`  
**Device**: `CUDA`  
**Total Automated Test Executions**: `35,000` tests  
**Total Suite Duration**: `1734.5s`  
**Completed Timestamp**: `2026-08-18 11:41:02 UTC`  

## 1. Executive Summary & Macro Performance Across Languages

| Metric Dimension | Benchmark Result | Evaluation Standard |
| --- | --- | --- |
| **Top-1 Retrieval (Recall@1)** | **93.04%** | Exact top-1 passage match |
| **Top-5 Retrieval (Recall@5)** | **99.96%** | Top-5 passage candidate pool |
| **Mean Reciprocal Rank (MRR@10)** | **0.9574** | Ranking quality |
| **Answer Semantic Similarity** | **0.5753** | Cosine similarity vs MS MARCO Ground Truth |
| **Token Overlap F1** | **34.15%** | Keyword & terminology preservation |
| **Faithfulness & Grounding** | **88.6%** | Evidence-supported response rate |
| **End-to-End Latency (p50)** | **18.55 ms** | Median response time |
| **End-to-End Latency (p95)** | **365.09 ms** | 95th percentile latency |
| **End-to-End Latency (p99)** | **474.33 ms** | 99th percentile worst-case latency |

## 2. Per-Language 5,000+ Test Evaluation Breakdown

| Language | Tests | Recall@1 | Recall@5 | MRR@10 | Semantic Sim | Token F1 | Faithfulness | E2E p50 (ms) | E2E p95 (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Hindi** | 5,000 | 94.24% | 99.98% | 0.9652 | 0.4776 | 29.05% | 77.9% | 18.73ms | 608.55ms |
| **Bengali** | 5,000 | 92.44% | 99.96% | 0.9537 | 0.5386 | 30.89% | 86.38% | 18.45ms | 21.47ms |
| **Marathi** | 5,000 | 93.74% | 99.96% | 0.9626 | 0.5095 | 27.78% | 80.14% | 18.3ms | 22.21ms |
| **Tamil** | 5,000 | 88.66% | 99.88% | 0.9279 | 0.6024 | 31.86% | 90.34% | 19.27ms | 659.04ms |
| **Telugu** | 5,000 | 91.78% | 99.98% | 0.9494 | 0.6159 | 34.51% | 93.64% | 18.56ms | 616.55ms |
| **Gujarati** | 5,000 | 92.58% | 99.98% | 0.9547 | 0.5864 | 35.8% | 94.02% | 18.41ms | 606.54ms |
| **English** | 5,000 | 97.82% | 100.0% | 0.9885 | 0.6964 | 49.13% | 97.78% | 18.13ms | 21.28ms |

## 3. Sub-System Latency Breakdown (Percentiles in ms)

| Language | Sub-System | Mean (ms) | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) |
| --- | --- | --- | --- | --- | --- | --- |
| Hindi | `embedding` | 0.69 | 0.5 | 1.53 | 1.62 | 2.81 |
| Hindi | `retrieval` | 17.31 | 18.12 | 23.56 | 26.18 | 31.43 |
| Hindi | `generation` | 56.31 | 0.27 | 0.6 | 588.46 | 882.6 |
| Hindi | `end_to_end` | 73.63 | 18.73 | 33.12 | 608.55 | 902.83 |
| Bengali | `embedding` | 0.54 | 0.44 | 1.42 | 1.46 | 1.5 |
| Bengali | `retrieval` | 18.3 | 18.22 | 19.89 | 21.23 | 24.53 |
| Bengali | `generation` | 0.23 | 0.22 | 0.31 | 0.35 | 0.44 |
| Bengali | `end_to_end` | 18.54 | 18.45 | 20.15 | 21.47 | 24.89 |
| Marathi | `embedding` | 0.6 | 0.42 | 1.54 | 1.62 | 1.72 |
| Marathi | `retrieval` | 18.19 | 18.04 | 20.09 | 21.96 | 25.23 |
| Marathi | `generation` | 0.25 | 0.24 | 0.34 | 0.38 | 0.5 |
| Marathi | `end_to_end` | 18.46 | 18.3 | 20.4 | 22.21 | 25.48 |
| Tamil | `embedding` | 0.77 | 0.61 | 1.68 | 2.05 | 2.14 |
| Tamil | `retrieval` | 21.34 | 18.7 | 29.25 | 35.18 | 47.5 |
| Tamil | `generation` | 68.68 | 0.23 | 0.59 | 635.46 | 928.87 |
| Tamil | `end_to_end` | 90.04 | 19.27 | 56.78 | 659.04 | 950.39 |
| Telugu | `embedding` | 0.6 | 0.5 | 0.91 | 1.12 | 2.59 |
| Telugu | `retrieval` | 19.56 | 18.24 | 24.47 | 27.96 | 36.1 |
| Telugu | `generation` | 41.64 | 0.22 | 0.36 | 595.73 | 675.4 |
| Telugu | `end_to_end` | 61.22 | 18.56 | 29.1 | 616.55 | 693.13 |
| Gujarati | `embedding` | 0.7 | 0.55 | 1.46 | 1.67 | 2.09 |
| Gujarati | `retrieval` | 19.21 | 18.1 | 23.36 | 27.31 | 33.93 |
| Gujarati | `generation` | 37.99 | 0.23 | 0.35 | 587.61 | 681.89 |
| Gujarati | `end_to_end` | 57.22 | 18.41 | 28.02 | 606.54 | 699.38 |
| English | `embedding` | 0.38 | 0.36 | 0.49 | 0.54 | 0.73 |
| English | `retrieval` | 17.99 | 17.92 | 19.8 | 21.07 | 23.95 |
| English | `generation` | 0.2 | 0.19 | 0.26 | 0.29 | 0.35 |
| English | `end_to_end` | 18.2 | 18.13 | 20.02 | 21.28 | 24.23 |

