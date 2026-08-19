# MSMARCO-XI Multilingual Validation Benchmark Report

**Model**: `models/msmarco-xi-multilingual-biencoder`  
**Device**: `CUDA`  
**Validation Timestamp**: `2026-08-18 11:04:07 UTC`  
**Total Benchmark Time**: `367.23s`  

## 1. Macro-Averaged Retrieval Metrics Across All Indic Languages

| Metric | Score |
| --- | --- |
| **Recall@1** | **23.01%** |
| **Recall@5** | **55.68%** |
| **Recall@10** | **65.98%** |
| **Recall@20** | **73.12%** |
| **MRR@10** | **0.365** |
| **NDCG@10** | **0.4358** |
| **Precision@5** | **11.14%** |

## 2. Per-Language Validation Results Breakdown

| Language | Code | Queries | Corpus Passages | Recall@1 | Recall@5 | Recall@10 | MRR@10 | NDCG@10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hindi | `hi` | 1000 | 16796 | 28.1% | 66.7% | 76.6% | 0.4333 | 0.5135 |
| Bengali | `bn` | 1000 | 16797 | 21.8% | 57.0% | 68.6% | 0.362 | 0.4398 |
| Marathi | `mr` | 1000 | 16796 | 27.4% | 65.4% | 75.6% | 0.4258 | 0.5053 |
| Tamil | `ta` | 1000 | 16797 | 21.6% | 53.3% | 62.8% | 0.344 | 0.4122 |
| Telugu | `te` | 1000 | 16797 | 22.6% | 58.9% | 69.7% | 0.3741 | 0.4517 |
| Gujarati | `gu` | 1000 | 16797 | 29.2% | 63.2% | 73.5% | 0.4323 | 0.5052 |
| Kannada | `kn` | 1000 | 16797 | 21.8% | 54.1% | 64.4% | 0.355 | 0.4246 |
| Malayalam | `ml` | 1000 | 16797 | 21.4% | 52.0% | 63.0% | 0.34 | 0.4094 |
| Punjabi | `pa` | 1000 | 16797 | 23.8% | 53.6% | 63.7% | 0.3654 | 0.4307 |
| Odia | `or` | 1000 | 16797 | 19.9% | 49.1% | 58.5% | 0.3209 | 0.3843 |
| Assamese | `as` | 1000 | 16796 | 19.3% | 47.1% | 55.7% | 0.3102 | 0.3697 |
| Nepali | `ne` | 1000 | 16797 | 24.7% | 60.8% | 71.2% | 0.3958 | 0.4719 |
| Sanskrit | `sa` | 1000 | 16797 | 15.1% | 38.2% | 49.0% | 0.2503 | 0.3073 |
| Urdu | `ur` | 1000 | 16797 | 25.5% | 60.1% | 71.4% | 0.4011 | 0.4763 |

