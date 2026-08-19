"""
Multilingual Validation Script for AI4Bharat MSMARCO-XI.
Evaluates IR metrics (MRR@10, Recall@K, NDCG@10, Precision@K) across all 14 Indic validation splits
comparing the fine-tuned RAG Bi-Encoder against base/reference models.
Uses hf_hub_download + PyArrow streaming for fast and reliable data loading.
Outputs:
  - reports/msmarco_xi_validation_report.json
  - reports/msmarco_xi_validation_report.md
"""

import os
import sys
import time
import json
import math
import argparse
from typing import List, Dict, Any, Iterator
import numpy as np
import pyarrow.parquet as pq
from huggingface_hub import hf_hub_download
import torch
from sentence_transformers import SentenceTransformer

# Ensure root workspace directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# UTF-8 stdout for Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

VALIDATION_SPLITS = {
    "hi": ("validation/hinval.parquet", "Hindi"),
    "bn": ("validation/benval.parquet", "Bengali"),
    "mr": ("validation/marval.parquet", "Marathi"),
    "ta": ("validation/tamval.parquet", "Tamil"),
    "te": ("validation/telval.parquet", "Telugu"),
    "gu": ("validation/gujval.parquet", "Gujarati"),
    "kn": ("validation/kanval.parquet", "Kannada"),
    "ml": ("validation/malval.parquet", "Malayalam"),
    "pa": ("validation/panval.parquet", "Punjabi"),
    "or": ("validation/orival.parquet", "Odia"),
    "as": ("validation/asmval.parquet", "Assamese"),
    "ne": ("validation/nepval.parquet", "Nepali"),
    "sa": ("validation/sanval.parquet", "Sanskrit"),
    "ur": ("validation/urdval.parquet", "Urdu")
}


def load_parquet_records(
    repo_id: str,
    filename: str,
    max_records: int = 5000,
    batch_size: int = 1000
) -> Iterator[Dict[str, Any]]:
    """Downloads parquet file via HuggingFace Hub and streams rows efficiently using PyArrow."""
    try:
        local_path = hf_hub_download(repo_id=repo_id, filename=filename, repo_type="dataset")
    except Exception as e:
        print(f"[!] Error downloading {filename} from {repo_id}: {e}")
        return

    parquet_file = pq.ParquetFile(local_path)
    count = 0

    for batch in parquet_file.iter_batches(batch_size=batch_size):
        df_batch = batch.to_pylist()
        for row in df_batch:
            yield row
            count += 1
            if max_records and count >= max_records:
                return


def compute_ir_metrics(
    query_embeddings: np.ndarray,
    corpus_embeddings: np.ndarray,
    query_to_doc_ids: List[int],
    k_values: List[int] = [1, 5, 10, 20]
) -> Dict[str, float]:
    """
    Computes Recall@K, MRR@10, NDCG@10, and Precision@5 given normalized embeddings.
    query_to_doc_ids[i] is the target ground truth document index in corpus_embeddings for query i.
    """
    num_queries = len(query_embeddings)
    if num_queries == 0 or len(corpus_embeddings) == 0:
        return {f"Recall@{k}": 0.0 for k in k_values} | {"MRR@10": 0.0, "NDCG@10": 0.0, "Precision@5": 0.0}

    # Cosine similarities matrix: (num_queries, num_docs)
    similarity_matrix = np.dot(query_embeddings, corpus_embeddings.T)

    recalls = {k: 0.0 for k in k_values}
    mrrs = []
    ndcgs = []
    precisions_5 = []

    for q_idx in range(num_queries):
        target_doc_idx = query_to_doc_ids[q_idx]
        sims = similarity_matrix[q_idx]
        
        # Rank descending
        ranked_indices = np.argsort(-sims)
        
        # Target rank (1-indexed)
        matches = np.where(ranked_indices == target_doc_idx)[0]
        if len(matches) > 0:
            rank = matches[0] + 1
        else:
            rank = len(sims) + 1

        # Recall @ K
        for k in k_values:
            if rank <= k:
                recalls[k] += 1.0

        # MRR @ 10
        if rank <= 10:
            mrrs.append(1.0 / rank)
        else:
            mrrs.append(0.0)

        # NDCG @ 10 (binary relevance)
        if rank <= 10:
            ndcgs.append(1.0 / math.log2(rank + 1))
        else:
            ndcgs.append(0.0)

        # Precision @ 5
        precisions_5.append(1.0 / 5.0 if rank <= 5 else 0.0)

    result = {}
    for k in k_values:
        result[f"Recall@{k}"] = round((recalls[k] / num_queries) * 100, 2)
    result["MRR@10"] = round(float(np.mean(mrrs)), 4)
    result["NDCG@10"] = round(float(np.mean(ndcgs)), 4)
    result["Precision@5"] = round(float(np.mean(precisions_5)) * 100, 2)
    return result


def evaluate_language_split(
    model: SentenceTransformer,
    lang_code: str,
    val_file: str,
    lang_name: str,
    num_queries: int = 500
) -> Dict[str, Any]:
    print(f"[*] Evaluating {lang_name} ({lang_code}) from {val_file} (target: {num_queries} queries)...")
    start_time = time.perf_counter()

    queries = []
    corpus = []
    query_to_doc = []
    doc_id = 0

    count = 0
    for row in load_parquet_records("ai4bharat/MSMARCO-XI", val_file, max_records=num_queries * 3):
        if count >= num_queries:
            break
        q_text = (row.get("query") or "").strip()
        if not q_text:
            continue

        passages = row.get("passages") or {}
        tr_passages = passages.get("Translated_passages") or []
        is_selected = passages.get("is_selected") or []

        has_selected = False
        target_doc_idx = None

        for p_text, sel in zip(tr_passages, is_selected):
            if not p_text or len(str(p_text).strip()) < 15:
                continue
            curr_doc_idx = doc_id
            corpus.append(str(p_text).strip())
            doc_id += 1
            if sel == 1 and not has_selected:
                target_doc_idx = curr_doc_idx
                has_selected = True

        if has_selected and target_doc_idx is not None:
            queries.append(q_text)
            query_to_doc.append(target_doc_idx)
            count += 1

    if not queries or not corpus:
        print(f"[!] No valid query-passage pairs found for {lang_code}")
        return {}

    # Compute normalized embeddings in batches
    query_embeddings = model.encode(
        queries,
        batch_size=64,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True
    )
    corpus_embeddings = model.encode(
        corpus,
        batch_size=128,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    metrics = compute_ir_metrics(query_embeddings, corpus_embeddings, query_to_doc)
    elapsed = round(time.perf_counter() - start_time, 2)

    return {
        "language_code": lang_code,
        "language_name": lang_name,
        "evaluated_queries": len(queries),
        "corpus_passages": len(corpus),
        "metrics": metrics,
        "evaluation_latency_sec": elapsed
    }


def run_full_validation(
    model_path: str = "models/msmarco-xi-multilingual-biencoder",
    fallback_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    languages: str = "all",
    queries_per_lang: int = 500,
    output_report_json: str = "reports/msmarco_xi_validation_report.json",
    output_report_md: str = "reports/msmarco_xi_validation_report.md"
):
    print("=" * 80)
    print("      AI4BHARAT MSMARCO-XI MULTILINGUAL VALIDATION BENCHMARK SUITE     ")
    print("=" * 80)

    target_path = model_path if os.path.exists(model_path) else fallback_model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[*] Loading Evaluation Model: {target_path} on {device.upper()}...")
    model = SentenceTransformer(target_path, device=device)

    if languages == "all":
        selected_langs = list(VALIDATION_SPLITS.keys())
    else:
        selected_langs = [l.strip() for l in languages.split(",") if l.strip() in VALIDATION_SPLITS]

    results = []
    overall_start = time.perf_counter()

    for idx, lang_code in enumerate(selected_langs, 1):
        val_file, lang_name = VALIDATION_SPLITS[lang_code]
        print(f"\n[{idx}/{len(selected_langs)}] Validating {lang_name}...")
        try:
            res = evaluate_language_split(
                model=model,
                lang_code=lang_code,
                val_file=val_file,
                lang_name=lang_name,
                num_queries=queries_per_lang
            )
            if res:
                results.append(res)
                m = res["metrics"]
                print(f"    [+] {lang_name} -> Recall@1: {m['Recall@1']}%, Recall@5: {m['Recall@5']}%, Recall@10: {m['Recall@10']}%, MRR@10: {m['MRR@10']}, NDCG@10: {m['NDCG@10']}")
        except Exception as e:
            print(f"    [!] Error validating {lang_name}: {e}")

    total_time = round(time.perf_counter() - overall_start, 2)

    # Compute Macro Averages
    if results:
        avg_r1 = round(float(np.mean([r["metrics"]["Recall@1"] for r in results])), 2)
        avg_r5 = round(float(np.mean([r["metrics"]["Recall@5"] for r in results])), 2)
        avg_r10 = round(float(np.mean([r["metrics"]["Recall@10"] for r in results])), 2)
        avg_r20 = round(float(np.mean([r["metrics"]["Recall@20"] for r in results])), 2)
        avg_mrr = round(float(np.mean([r["metrics"]["MRR@10"] for r in results])), 4)
        avg_ndcg = round(float(np.mean([r["metrics"]["NDCG@10"] for r in results])), 4)
        avg_p5 = round(float(np.mean([r["metrics"]["Precision@5"] for r in results])), 2)
    else:
        avg_r1 = avg_r5 = avg_r10 = avg_r20 = avg_mrr = avg_ndcg = avg_p5 = 0.0

    report = {
        "model_evaluated": target_path,
        "device": device,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "total_evaluation_time_sec": total_time,
        "total_languages_evaluated": len(results),
        "macro_average_metrics": {
            "Recall@1": avg_r1,
            "Recall@5": avg_r5,
            "Recall@10": avg_r10,
            "Recall@20": avg_r20,
            "MRR@10": avg_mrr,
            "NDCG@10": avg_ndcg,
            "Precision@5": avg_p5
        },
        "per_language_results": results
    }

    os.makedirs(os.path.dirname(output_report_json), exist_ok=True)
    with open(output_report_json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    # Write Markdown Report
    with open(output_report_md, "w", encoding="utf-8") as f:
        f.write("# MSMARCO-XI Multilingual Validation Benchmark Report\n\n")
        f.write(f"**Model**: `{target_path}`  \n")
        f.write(f"**Device**: `{device.upper()}`  \n")
        f.write(f"**Validation Timestamp**: `{report['timestamp']}`  \n")
        f.write(f"**Total Benchmark Time**: `{total_time}s`  \n\n")

        f.write("## 1. Macro-Averaged Retrieval Metrics Across All Indic Languages\n\n")
        f.write("| Metric | Score |\n")
        f.write("| --- | --- |\n")
        f.write(f"| **Recall@1** | **{avg_r1}%** |\n")
        f.write(f"| **Recall@5** | **{avg_r5}%** |\n")
        f.write(f"| **Recall@10** | **{avg_r10}%** |\n")
        f.write(f"| **Recall@20** | **{avg_r20}%** |\n")
        f.write(f"| **MRR@10** | **{avg_mrr}** |\n")
        f.write(f"| **NDCG@10** | **{avg_ndcg}** |\n")
        f.write(f"| **Precision@5** | **{avg_p5}%** |\n\n")

        f.write("## 2. Per-Language Validation Results Breakdown\n\n")
        f.write("| Language | Code | Queries | Corpus Passages | Recall@1 | Recall@5 | Recall@10 | MRR@10 | NDCG@10 |\n")
        f.write("| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n")
        for r in results:
            m = r["metrics"]
            f.write(f"| {r['language_name']} | `{r['language_code']}` | {r['evaluated_queries']} | {r['corpus_passages']} | {m['Recall@1']}% | {m['Recall@5']}% | {m['Recall@10']}% | {m['MRR@10']} | {m['NDCG@10']} |\n")
        f.write("\n")

    print("\n" + "=" * 80)
    print("                       VALIDATION SUMMARY TABLE                        ")
    print("=" * 80)
    print(f"{'Language':<12} | {'Recall@1':<10} | {'Recall@5':<10} | {'Recall@10':<10} | {'MRR@10':<8} | {'NDCG@10':<8}")
    print("-" * 80)
    for r in results:
        m = r["metrics"]
        print(f"{r['language_name']:<12} | {m['Recall@1']:<9}% | {m['Recall@5']:<9}% | {m['Recall@10']:<9}% | {m['MRR@10']:<8} | {m['NDCG@10']:<8}")
    print("-" * 80)
    print(f"{'MACRO AVG':<12} | {avg_r1:<9}% | {avg_r5:<9}% | {avg_r10:<9}% | {avg_mrr:<8} | {avg_ndcg:<8}")
    print("=" * 80)
    print(f"[+] Saved reports to {output_report_json} and {output_report_md}")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate Multilingual RAG Model on MSMARCO-XI")
    parser.add_argument("--model", type=str, default="models/msmarco-xi-multilingual-biencoder")
    parser.add_argument("--fallback_model", type=str, default="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    parser.add_argument("--langs", type=str, default="all")
    parser.add_argument("--queries_per_lang", type=int, default=500)
    args = parser.parse_args()

    run_full_validation(
        model_path=args.model,
        fallback_model=args.fallback_model,
        languages=args.langs,
        queries_per_lang=args.queries_per_lang
    )
