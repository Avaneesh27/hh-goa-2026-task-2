"""
Latency Benchmark Suite.
Runs 150+ multilingual queries through the live pipeline with warm cache,
measuring exact monotonic durations for:
  - Query Processing
  - Embedding
  - Dense Retrieval
  - BM25 Retrieval
  - Fusion
  - Reranking
  - Context Selection
  - Answer Generation
  - Guardrails
  - Total RAG Latency & End-to-End Latency
Calculates P50, P70, P90, P95, P99, and P100 percentiles.
Outputs: reports/latency_benchmark.json and reports/latency_benchmark.md
"""

import os
import sys
import json
import time
import asyncio
from typing import List, Dict, Any

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.orchestrator import rag_orchestrator


def compute_percentiles(values: List[float]) -> Dict[str, float]:
    if not values:
        return {"p50": 0.0, "p70": 0.0, "p90": 0.0, "p95": 0.0, "p99": 0.0, "p100": 0.0, "mean": 0.0, "min": 0.0}
    s = sorted(values)
    n = len(s)
    return {
        "min": round(s[0], 2),
        "p50": round(s[int(n * 0.50)], 2),
        "p70": round(s[int(n * 0.70)], 2),
        "p90": round(s[int(n * 0.90)], 2),
        "p95": round(s[int(min(n - 1, int(n * 0.95)))], 2),
        "p99": round(s[int(min(n - 1, int(n * 0.99)))], 2),
        "p100": round(s[-1], 2),
        "mean": round(sum(s) / n, 2)
    }


async def run_latency_benchmark(
    benchmark_file: str = "benchmarks/benchmark_queries.json",
    output_json: str = "reports/latency_benchmark.json",
    output_md: str = "reports/latency_benchmark.md"
):
    print(f"[*] Starting Latency Benchmark using {benchmark_file}...")
    start_time = time.perf_counter()

    with open(benchmark_file, "r", encoding="utf-8") as f:
        queries = json.load(f)

    print(f"[*] Pre-warming pipeline with 3 queries...")
    for q_warm in queries[:3]:
        _ = await rag_orchestrator.process_text_query(q_warm["query"])

    print(f"[*] Running latency tests across {len(queries)} queries...")

    metrics = {
        "query_processing_ms": [],
        "embedding_ms": [],
        "dense_retrieval_ms": [],
        "bm25_ms": [],
        "fusion_ms": [],
        "reranking_ms": [],
        "context_selection_ms": [],
        "generation_ms": [],
        "guardrails_ms": [],
        "total_rag_ms": [],
        "end_to_end_ms": []
    }

    grounded_count = 0
    abstained_count = 0

    for idx, q_item in enumerate(queries, 1):
        resp = await rag_orchestrator.process_text_query(q_item["query"])
        
        if resp.abstained:
            abstained_count += 1
        if resp.grounded:
            grounded_count += 1

        lat = resp.latency
        metrics["query_processing_ms"].append(lat.query_processing_ms)
        metrics["embedding_ms"].append(lat.embedding_ms)
        metrics["dense_retrieval_ms"].append(lat.dense_retrieval_ms)
        metrics["bm25_ms"].append(lat.bm25_ms)
        metrics["fusion_ms"].append(lat.fusion_ms)
        metrics["reranking_ms"].append(lat.reranking_ms)
        metrics["context_selection_ms"].append(lat.context_selection_ms)
        metrics["generation_ms"].append(lat.generation_ms)
        metrics["guardrails_ms"].append(lat.guardrails_ms)
        metrics["total_rag_ms"].append(lat.total_rag_ms)
        metrics["end_to_end_ms"].append(lat.end_to_end_ms)

        if idx % 25 == 0:
            print(f"    Progress: {idx}/{len(queries)} queries processed...")

    percentile_report = {k: compute_percentiles(v) for k, v in metrics.items()}
    total_elapsed = round(time.perf_counter() - start_time, 2)

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "total_queries_tested": len(queries),
        "grounded_answers_count": grounded_count,
        "abstained_answers_count": abstained_count,
        "benchmark_duration_sec": total_elapsed,
        "latency_percentiles_ms": percentile_report
    }

    # Save JSON report
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    # Save Markdown report
    with open(output_md, "w", encoding="utf-8") as f:
        f.write("# Latency Benchmark Report — HH Goa 2026 Voice RAG\n\n")
        f.write(f"**Total Queries Tested**: `{len(queries)}`  \n")
        f.write(f"**Timestamp**: `{report['timestamp']}`  \n")
        f.write(f"**Benchmark Runtime**: `{total_elapsed}s`  \n")
        f.write(f"**Grounded Answers**: `{grounded_count}` | **Abstained Answers**: `{abstained_count}`  \n\n")

        f.write("## Component Latency Breakdown & Percentiles (in milliseconds)\n\n")
        f.write("| Component Stage | Min | P50 (Median) | P70 | P90 | P95 | P99 | P100 (Max) | Mean |\n")
        f.write("|---|---|---|---|---|---|---|---|---|\n")

        stage_labels = {
            "query_processing_ms": "Query Processing",
            "embedding_ms": "Embedding (Query)",
            "dense_retrieval_ms": "Dense Vector Search",
            "bm25_ms": "BM25 Keyword Search",
            "fusion_ms": "RRF Candidate Fusion",
            "reranking_ms": "Cross-Encoder Reranking",
            "context_selection_ms": "Context Selection & Dedup",
            "generation_ms": "Grounded Generation",
            "guardrails_ms": "Guardrails & Verification",
            "total_rag_ms": "**Total RAG Latency**",
            "end_to_end_ms": "**End-to-End Latency**"
        }

        for key, label in stage_labels.items():
            p = percentile_report.get(key, {})
            f.write(f"| {label} | {p.get('min',0)} ms | **{p.get('p50',0)} ms** | **{p.get('p70',0)} ms** | {p.get('p90',0)} ms | {p.get('p95',0)} ms | {p.get('p99',0)} ms | **{p.get('p100',0)} ms** | {p.get('mean',0)} ms |\n")
        f.write("\n")

    print("\n" + "="*90)
    print("                    LATENCY BENCHMARK PERCENTILES REPORT (ms)                   ")
    print("="*90)
    print(f"{'Component':<26} | {'P50':<8} | {'P70':<8} | {'P90':<8} | {'P95':<8} | {'P100':<8} | {'Mean':<8}")
    print("-" * 90)
    for key, label in stage_labels.items():
        p = percentile_report.get(key, {})
        print(f"{label:<26} | {p.get('p50',0):<8} | {p.get('p70',0):<8} | {p.get('p90',0):<8} | {p.get('p95',0):<8} | {p.get('p100',0):<8} | {p.get('mean',0):<8}")
    print("="*90 + "\n")
    print(f"[+] Saved latency report to {output_json} and {output_md}")
    return report


if __name__ == "__main__":
    asyncio.run(run_latency_benchmark())
