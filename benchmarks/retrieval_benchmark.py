"""
Retrieval Benchmark Suite.
Evaluates and compares:
  - Dense Vector Search Only
  - BM25 Keyword Search Only
  - Hybrid RRF (Dense + BM25)
  - Hybrid RRF + Cross-Encoder Reranker
Measures Recall@5, Recall@10, Recall@20, MRR, and Precision@5 on ground-truth MSMARCO-XI test queries.
Outputs: reports/retrieval_benchmark.json
"""

import os
import sys
import json
import time
from typing import List, Dict, Any

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.config import settings
from backend.embeddings import embedding_manager
from backend.retrieval import hybrid_retriever
from backend.reranker import reranker


def calculate_metrics(retrieved_doc_ids: List[str], ground_truth_doc_ids: List[str]):
    """Calculates Recall@5, Recall@10, Recall@20, MRR, and Precision@5."""
    if not ground_truth_doc_ids:
        return {"r5": 0.0, "r10": 0.0, "r20": 0.0, "mrr": 0.0, "p5": 0.0}

    gt_set = set(ground_truth_doc_ids)

    # Recall @ K
    r5 = 1.0 if any(doc in gt_set for doc in retrieved_doc_ids[:5]) else 0.0
    r10 = 1.0 if any(doc in gt_set for doc in retrieved_doc_ids[:10]) else 0.0
    r20 = 1.0 if any(doc in gt_set for doc in retrieved_doc_ids[:20]) else 0.0

    # Precision @ 5
    p5 = sum(1 for doc in retrieved_doc_ids[:5] if doc in gt_set) / 5.0

    # MRR (Mean Reciprocal Rank)
    mrr = 0.0
    for rank, doc in enumerate(retrieved_doc_ids, 1):
        if doc in gt_set:
            mrr = 1.0 / rank
            break

    return {"r5": r5, "r10": r10, "r20": r20, "mrr": mrr, "p5": p5}


def run_retrieval_benchmark(
    benchmark_file: str = "benchmarks/benchmark_queries.json",
    output_report: str = "reports/retrieval_benchmark.json"
):
    print(f"[*] Starting Retrieval Benchmark using {benchmark_file}...")
    start_time = time.perf_counter()

    with open(benchmark_file, "r", encoding="utf-8") as f:
        all_queries = json.load(f)

    # Filter to queries with ground truth
    eval_queries = [q for q in all_queries if q.get("has_ground_truth") and q.get("ground_truth_doc_ids")]
    print(f"[*] Running benchmark across {len(eval_queries)} ground-truth labeled queries...")

    # Warm up models
    _ = embedding_manager.embed_query("warmup")
    _ = hybrid_retriever.retrieve("warmup")
    _ = reranker._get_cross_encoder()

    results_dense = []
    results_bm25 = []
    results_fused = []
    results_reranked = []

    for q_item in eval_queries:
        query_text = q_item["query"]
        gt_docs = q_item["ground_truth_doc_ids"]

        # Run full retrieval
        ret_out = hybrid_retriever.retrieve(
            query=query_text,
            dense_top_k=20,
            bm25_top_k=20,
            fused_top_k=20
        )

        dense_ids = [c.get("document_id") for c in ret_out["dense_results"]]
        bm25_ids = [c.get("document_id") for c in ret_out["bm25_results"]]
        fused_ids = [c.get("document_id") for c in ret_out["fused_results"]]

        # Rerank
        rerank_out = reranker.rerank(query_text, ret_out["fused_results"], top_k=5)
        reranked_ids = [c.get("document_id") for c in rerank_out["reranked_results"]]

        results_dense.append(calculate_metrics(dense_ids, gt_docs))
        results_bm25.append(calculate_metrics(bm25_ids, gt_docs))
        results_fused.append(calculate_metrics(fused_ids, gt_docs))
        results_reranked.append(calculate_metrics(reranked_ids, gt_docs))

    def aggregate(metric_list):
        n = max(1, len(metric_list))
        return {
            "Recall@5": round(sum(m["r5"] for m in metric_list) / n * 100, 2),
            "Recall@10": round(sum(m["r10"] for m in metric_list) / n * 100, 2),
            "Recall@20": round(sum(m["r20"] for m in metric_list) / n * 100, 2),
            "MRR": round(sum(m["mrr"] for m in metric_list) / n, 4),
            "Precision@5": round(sum(m["p5"] for m in metric_list) / n * 100, 2)
        }

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "total_evaluated_queries": len(eval_queries),
        "strategies_comparison": {
            "Dense Only (Vector Search)": aggregate(results_dense),
            "BM25 Only (Keyword Search)": aggregate(results_bm25),
            "Hybrid RRF (Dense + BM25)": aggregate(results_fused),
            "Hybrid RRF + Reranker (Top 5)": aggregate(results_reranked)
        },
        "benchmark_duration_sec": round(time.perf_counter() - start_time, 2)
    }

    os.makedirs(os.path.dirname(output_report), exist_ok=True)
    with open(output_report, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n" + "="*80)
    print("                 RETRIEVAL EVALUATION BENCHMARK RESULTS                 ")
    print("="*80)
    print(f"{'Strategy':<30} | {'Recall@5':<10} | {'Recall@10':<10} | {'Recall@20':<10} | {'MRR':<8} | {'P@5':<8}")
    print("-" * 80)
    for strat, metrics in report["strategies_comparison"].items():
        print(f"{strat:<30} | {metrics['Recall@5']:<9}% | {metrics['Recall@10']:<9}% | {metrics['Recall@20']:<9}% | {metrics['MRR']:<8} | {metrics['Precision@5']:<7}%")
    print("="*80 + "\n")
    print(f"[+] Saved retrieval benchmark report to {output_report}")
    return report


if __name__ == "__main__":
    run_retrieval_benchmark()
