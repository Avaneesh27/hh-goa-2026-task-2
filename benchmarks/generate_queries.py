"""
Generates a curated benchmark dataset of 150+ multilingual test queries from MSMARCO-XI
including ground-truth relevancy labels, English translations, Hinglish queries,
factoid, definition, numeric, and out-of-domain unsupported control queries.
Outputs: benchmarks/benchmark_queries.json
"""

import os
import sys
import json
import random

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datasets import load_dataset


def generate_benchmark_queries(
    data_file: str = "validation/hinval.parquet",
    num_dataset_queries: int = 120,
    output_path: str = "benchmarks/benchmark_queries.json"
):
    print(f"[*] Extracting {num_dataset_queries} benchmark queries from {data_file}...")
    ds = load_dataset("ai4bharat/MSMARCO-XI", data_files={"validation": data_file}, split="validation")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    benchmark_data = []

    # 1. Sample MSMARCO-XI queries with ground truth
    count = 0
    for idx in range(len(ds)):
        ex = ds[idx]
        q_id = ex.get("query_id")
        q_type = ex.get("query_type", "DESCRIPTION")
        hi_query = (ex.get("query", "") or "").strip()
        en_query = (ex.get("Eng_Query", "") or "").strip()
        hi_answer = (ex.get("Answer", "") or "").strip()
        en_answer = (ex.get("Eng_Answer", "") or "").strip()
        
        passages_obj = ex.get("passages", {}) or {}
        tr_passages = passages_obj.get("Translated_passages", []) or []
        is_selected = passages_obj.get("is_selected", []) or []

        if not hi_query or len(hi_query) < 5:
            continue

        selected_indices = [i for i, sel in enumerate(is_selected) if sel == 1]
        ground_truth_doc_ids = [f"doc_{q_id}_{i}_hi" for i in selected_indices]
        ground_truth_texts = [tr_passages[i] for i in selected_indices if i < len(tr_passages)]

        benchmark_data.append({
            "query_id": q_id,
            "query": hi_query,
            "english_query": en_query,
            "language": "hi",
            "intent": q_type.lower() if q_type else "factual",
            "ground_truth_answer": hi_answer,
            "ground_truth_doc_ids": ground_truth_doc_ids,
            "has_ground_truth": len(selected_indices) > 0,
            "category": "in_corpus_hindi"
        })

        count += 1
        if count >= num_dataset_queries:
            break

    # 2. Add English queries from the same subset
    for i in range(20):
        if i < len(benchmark_data):
            rec = benchmark_data[i]
            benchmark_data.append({
                "query_id": f"en_{rec['query_id']}",
                "query": rec["english_query"],
                "english_query": rec["english_query"],
                "language": "en",
                "intent": rec["intent"],
                "ground_truth_answer": rec["ground_truth_answer"],
                "ground_truth_doc_ids": rec["ground_truth_doc_ids"],
                "has_ground_truth": rec["has_ground_truth"],
                "category": "in_corpus_english"
            })

    # 3. Add Hinglish conversational queries
    hinglish_samples = [
        {"query": "Corporation kya hota hai?", "language": "hinglish", "intent": "definition", "has_ground_truth": True, "category": "hinglish"},
        {"query": "Rachel Carson ne konsi book likhi thi?", "language": "hinglish", "intent": "factual", "has_ground_truth": True, "category": "hinglish"},
        {"query": "Low potassium food ka chart batao", "language": "hinglish", "intent": "factual", "has_ground_truth": False, "category": "hinglish"},
        {"query": "Broadcom corporation kis field ki company thi?", "language": "hinglish", "intent": "factual", "has_ground_truth": True, "category": "hinglish"}
    ]
    for h_idx, h in enumerate(hinglish_samples):
        benchmark_data.append({
            "query_id": f"hinglish_{h_idx}",
            "query": h["query"],
            "english_query": h["query"],
            "language": h["language"],
            "intent": h["intent"],
            "ground_truth_answer": "",
            "ground_truth_doc_ids": [],
            "has_ground_truth": h["has_ground_truth"],
            "category": "hinglish"
        })

    # 4. Add Unsupported / Out-of-Domain Control Queries for Abstention Evaluation
    unsupported_controls = [
        "Who won the 2026 Mars Olympics marathon?",
        "What is the average flight speed of an alien spacecraft on Jupiter?",
        "How do I create a nuclear reactor in my kitchen backyard?",
        "What is the secret recipe of Coca Cola in the year 3000?",
        "who was the president of the moon in 1845?",
        "मंगल ग्रह पर पहला क्रिकेट मैच किसने जीता था?",
        "टाइम मशीन बनाने के आसान घरेलू उपाय क्या हैं?",
        "जादू की छड़ी से सोने के सिक्के कैसे बनाएं?"
    ]
    for u_idx, u_query in enumerate(unsupported_controls):
        benchmark_data.append({
            "query_id": f"unsupported_{u_idx}",
            "query": u_query,
            "english_query": u_query,
            "language": "hi" if any("\u0900" <= c <= "\u097f" for c in u_query) else "en",
            "intent": "unsupported",
            "ground_truth_answer": "No Answer Present",
            "ground_truth_doc_ids": [],
            "has_ground_truth": False,
            "category": "out_of_domain_unsupported"
        })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(benchmark_data, f, indent=2, ensure_ascii=False)

    print(f"[+] Successfully compiled {len(benchmark_data)} benchmark queries to {output_path}")
    return benchmark_data


if __name__ == "__main__":
    generate_benchmark_queries(num_dataset_queries=130)
