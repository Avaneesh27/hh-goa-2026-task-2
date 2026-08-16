"""
Dataset Inspector for AI4Bharat MSMARCO-XI Dataset
Inspects schema, fields, document/query structure, language distributions,
character/word lengths, noise, empty/malformed passages, and ground-truth labels.
Outputs reports/dataset_report.json and reports/dataset_report.md.
"""

import os
import sys
import json
import time
import re
from collections import Counter
from typing import Dict, Any, List

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from datasets import load_dataset, load_dataset_builder


def inspect_dataset(
    dataset_name: str = "ai4bharat/MSMARCO-XI",
    data_file: str = "validation/hinval.parquet",
    sample_size: int = 5000,
    output_dir: str = "reports"
) -> Dict[str, Any]:
    print(f"[*] Starting inspection of {dataset_name} ({data_file}, sample_size={sample_size})...")
    start_time = time.time()

    os.makedirs(output_dir, exist_ok=True)

    # 1. Builder and Schema Info
    builder = load_dataset_builder(dataset_name)
    splits_info = {k: {"num_examples": v.num_examples, "num_bytes": v.num_bytes} for k, v in builder.info.splits.items()} if builder.info.splits else {}

    # 2. Load Target Parquet Data
    ds = load_dataset(dataset_name, data_files={"validation": data_file}, split="validation")
    total_in_split = len(ds)
    sample_limit = min(sample_size, total_in_split)

    total_sampled = 0
    query_types = Counter()
    
    # Hindi stats
    hindi_passage_char_lens = []
    hindi_passage_word_lens = []
    hindi_query_char_lens = []
    hindi_query_word_lens = []

    # English stats
    eng_passage_char_lens = []
    eng_passage_word_lens = []
    eng_query_char_lens = []
    eng_query_word_lens = []

    # Noise & Malformed checks
    html_tag_regex = re.compile(r"<[^>]+>")
    url_regex = re.compile(r"https?://\S+|www\.\S+")
    
    html_noisy_passages = 0
    url_passages = 0
    empty_passages = 0
    short_passages = 0  # < 20 chars
    long_passages = 0   # > 1500 chars
    total_passages_analyzed = 0
    
    selected_passages_per_query = Counter()
    passage_count_per_query = Counter()
    
    duplicate_hindi_queries = 0
    seen_hindi_queries = set()
    duplicate_passages = 0
    seen_passages_sample = set()

    sample_hindi_records = []

    for i in range(sample_limit):
        ex = ds[i]
        total_sampled += 1
        source_lang = ex.get("source_lang", "eng_Latn")
        target_lang = ex.get("target_lang", "hin_Deva")
        q_id = ex.get("query_id")
        q_type = ex.get("query_type", "UNKNOWN")
        hi_query = (ex.get("query", "") or "").strip()
        en_query = (ex.get("Eng_Query", "") or "").strip()
        hi_answer = (ex.get("Answer", "") or "").strip()
        en_answer = (ex.get("Eng_Answer", "") or "").strip()
        
        passages_obj = ex.get("passages", {}) or {}
        en_passages = passages_obj.get("English_passages", []) or []
        tr_passages = passages_obj.get("Translated_passages", []) or []
        is_selected = passages_obj.get("is_selected", []) or []

        query_types[q_type] += 1

        num_passages = len(tr_passages) if tr_passages else len(en_passages)
        passage_count_per_query[num_passages] += 1
        selected_count = sum(is_selected) if is_selected else 0
        selected_passages_per_query[selected_count] += 1

        # Query stats
        if hi_query:
            if hi_query in seen_hindi_queries:
                duplicate_hindi_queries += 1
            else:
                seen_hindi_queries.add(hi_query)
            
            hindi_query_char_lens.append(len(hi_query))
            hindi_query_word_lens.append(len(hi_query.split()))

        if en_query:
            eng_query_char_lens.append(len(en_query))
            eng_query_word_lens.append(len(en_query.split()))

        # Save representative samples
        if len(sample_hindi_records) < 5:
            sample_hindi_records.append({
                "query_id": q_id,
                "query_type": q_type,
                "hindi_query": hi_query,
                "english_query": en_query,
                "hindi_answer": hi_answer,
                "english_answer": en_answer,
                "passage_count": len(tr_passages),
                "selected_indices": [idx for idx, sel in enumerate(is_selected) if sel == 1],
                "sample_hindi_passage": tr_passages[0][:200] if tr_passages else "",
                "sample_english_passage": en_passages[0][:200] if en_passages else ""
            })

        # Passage stats
        for en_p, tr_p in zip(en_passages, tr_passages):
            total_passages_analyzed += 1
            
            # English passage metrics
            if en_p:
                eng_passage_char_lens.append(len(en_p))
                eng_passage_word_lens.append(len(en_p.split()))
            
            # Hindi (translated) passage metrics
            if tr_p is not None:
                p_text = str(tr_p).strip()
                if not p_text:
                    empty_passages += 1
                else:
                    char_len = len(p_text)
                    word_len = len(p_text.split())
                    hindi_passage_char_lens.append(char_len)
                    hindi_passage_word_lens.append(word_len)

                    if char_len < 20:
                        short_passages += 1
                    elif char_len > 1500:
                        long_passages += 1

                    if html_tag_regex.search(p_text):
                        html_noisy_passages += 1
                    if url_regex.search(p_text):
                        url_passages += 1

                    # Duplicate check
                    p_sample_key = p_text[:80]
                    if p_sample_key in seen_passages_sample:
                        duplicate_passages += 1
                    else:
                        seen_passages_sample.add(p_sample_key)
            else:
                empty_passages += 1

    elapsed = time.time() - start_time

    def calc_percentiles(vals):
        if not vals:
            return {"min": 0, "p25": 0, "p50": 0, "p75": 0, "p90": 0, "p99": 0, "max": 0, "mean": 0}
        s = sorted(vals)
        n = len(s)
        return {
            "min": int(s[0]),
            "p25": int(s[int(n * 0.25)]),
            "p50": int(s[int(n * 0.50)]),
            "p75": int(s[int(n * 0.75)]),
            "p90": int(s[int(n * 0.90)]),
            "p99": int(s[int(min(n - 1, int(n * 0.99)))]),
            "max": int(s[-1]),
            "mean": round(sum(s) / n, 2)
        }

    report = {
        "dataset_name": dataset_name,
        "split_inspected": data_file,
        "total_examples_in_split": total_in_split,
        "inspection_timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "inspection_duration_sec": round(elapsed, 2),
        "dataset_level_info": {
            "splits": splits_info,
            "fields_summary": {
                "source_lang": "Flores/NLLB source language code (e.g. 'eng_Latn')",
                "target_lang": "Target Indic language code (e.g. 'hin_Deva')",
                "query_id": "Unique integer query ID from MS MARCO",
                "query_type": "Classification string (DESCRIPTION, NUMERIC, ENTITY, LOCATION, PERSON)",
                "query": "Translated query string in target_lang (Hindi in hin_Deva)",
                "Eng_Query": "Original English query string",
                "Answer": "Translated ground truth answer in target_lang",
                "Eng_Answer": "Original English ground truth answer",
                "passages.English_passages": "List of ~10 passage strings in English",
                "passages.Translated_passages": "List of ~10 passage strings translated into target_lang",
                "passages.is_selected": "List of binary labels (0/1) indicating which passage answers the query",
                "meta": "Metadata dictionary containing generation hyperparameters (model_name, temperature, top_p, etc.)"
            }
        },
        "sample_statistics": {
            "total_queries_sampled": total_sampled,
            "total_passages_analyzed": total_passages_analyzed,
            "target_language": "hin_Deva (Hindi in Devanagari script)",
            "query_type_distribution": dict(query_types.most_common(10)),
            "passages_per_query_distribution": dict(passage_count_per_query.most_common()),
            "selected_passages_per_query": dict(selected_passages_per_query.most_common())
        },
        "hindi_statistics": {
            "query_char_length": calc_percentiles(hindi_query_char_lens),
            "query_word_length": calc_percentiles(hindi_query_word_lens),
            "passage_char_length": calc_percentiles(hindi_passage_char_lens),
            "passage_word_length": calc_percentiles(hindi_passage_word_lens),
            "duplicate_queries_in_sample": duplicate_hindi_queries
        },
        "english_statistics": {
            "query_char_length": calc_percentiles(eng_query_char_lens),
            "query_word_length": calc_percentiles(eng_query_word_lens),
            "passage_char_length": calc_percentiles(eng_passage_char_lens),
            "passage_word_length": calc_percentiles(eng_passage_word_lens)
        },
        "noise_and_quality_audit": {
            "empty_passages": empty_passages,
            "short_passages_under_20_chars": short_passages,
            "long_passages_over_1500_chars": long_passages,
            "html_noisy_passages": html_noisy_passages,
            "url_passages": url_passages,
            "sample_duplicate_passages_detected": duplicate_passages
        },
        "sample_records": sample_hindi_records
    }

    # Save JSON report
    json_path = os.path.join(output_dir, "dataset_report.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"[+] Saved JSON report to {json_path}")

    # Generate Markdown report
    md_path = os.path.join(output_dir, "dataset_report.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# MSMARCO-XI Dataset Inspection Report\n\n")
        f.write(f"**Dataset**: `{dataset_name}`  \n")
        f.write(f"**Split/File**: `{data_file}`  \n")
        f.write(f"**Total Examples in Hindi Split**: `{total_in_split:,}`  \n")
        f.write(f"**Sampled Queries for Profiling**: `{total_sampled:,}`  \n")
        f.write(f"**Total Passages Analyzed**: `{total_passages_analyzed:,}`  \n")
        f.write(f"**Inspection Time**: `{report['inspection_timestamp']}` ({report['inspection_duration_sec']}s)  \n\n")
        
        f.write("## 1. Dataset Schema & Fields\n\n")
        f.write("| Field | Type | Description |\n")
        f.write("| --- | --- | --- |\n")
        for field, desc in report["dataset_level_info"]["fields_summary"].items():
            f.write(f"| `{field}` | string/list/dict | {desc} |\n")
        f.write("\n")

        f.write("## 2. Dataset Size & Splits Across MSMARCO-XI\n\n")
        f.write("| Split | Examples | Raw Bytes | Approx Size |\n")
        f.write("| --- | --- | --- | --- |\n")
        for s_name, s_info in splits_info.items():
            f.write(f"| `{s_name}` | {s_info['num_examples']:,} | {s_info['num_bytes']:,} | {round(s_info['num_bytes']/(1024**3), 2)} GB |\n")
        f.write(f"| `validation/hinval.parquet` | {total_in_split:,} | N/A | ~150 MB |\n")
        f.write("\n")

        f.write("## 3. Query Types & Target Language Profile\n\n")
        f.write(f"- **Target Language**: `{report['sample_statistics']['target_language']}`\n\n")
        f.write("| Query Type | Count | Percentage |\n")
        f.write("| --- | --- | --- |\n")
        for q_type, count in report["sample_statistics"]["query_type_distribution"].items():
            pct = round((count / total_sampled) * 100, 2)
            f.write(f"| `{q_type}` | {count:,} | {pct}% |\n")
        f.write("\n")

        f.write("## 4. Document & Passage Length Distributions\n\n")
        f.write("### Hindi Passages (`hin_Deva`)\n\n")
        f.write("| Metric | Character Length | Word Length |\n")
        f.write("| --- | --- | --- |\n")
        for metric in ["min", "p25", "p50", "p75", "p90", "p99", "max", "mean"]:
            c_val = report["hindi_statistics"]["passage_char_length"].get(metric, 0)
            w_val = report["hindi_statistics"]["passage_word_length"].get(metric, 0)
            f.write(f"| **{metric.upper()}** | {c_val} | {w_val} |\n")
        f.write("\n")

        f.write("### English Passages (`eng_Latn`)\n\n")
        f.write("| Metric | Character Length | Word Length |\n")
        f.write("| --- | --- | --- |\n")
        for metric in ["min", "p25", "p50", "p75", "p90", "p99", "max", "mean"]:
            c_val = report["english_statistics"]["passage_char_length"].get(metric, 0)
            w_val = report["english_statistics"]["passage_word_length"].get(metric, 0)
            f.write(f"| **{metric.upper()}** | {c_val} | {w_val} |\n")
        f.write("\n")

        f.write("### Hindi Query Distribution\n\n")
        f.write("| Metric | Character Length | Word Length |\n")
        f.write("| --- | --- | --- |\n")
        for metric in ["min", "p25", "p50", "p75", "p90", "p99", "max", "mean"]:
            c_val = report["hindi_statistics"]["query_char_length"].get(metric, 0)
            w_val = report["hindi_statistics"]["query_word_length"].get(metric, 0)
            f.write(f"| **{metric.upper()}** | {c_val} | {w_val} |\n")
        f.write("\n")

        f.write("## 5. Noise, Quality & Malformed Content Audit\n\n")
        f.write(f"- **Total Passages Analyzed**: `{total_passages_analyzed:,}`\n")
        f.write(f"- **Empty Passages**: `{empty_passages}`\n")
        f.write(f"- **Short Passages (<20 chars)**: `{short_passages}`\n")
        f.write(f"- **Long Passages (>1500 chars)**: `{long_passages}`\n")
        f.write(f"- **HTML Tag Noise**: `{html_noisy_passages}` ({round(html_noisy_passages/max(1, total_passages_analyzed)*100, 3)}%)\n")
        f.write(f"- **URLs in Passages**: `{url_passages}` ({round(url_passages/max(1, total_passages_analyzed)*100, 3)}%)\n")
        f.write(f"- **Duplicate Passages in Sample**: `{duplicate_passages}`\n")
        f.write(f"- **Duplicate Hindi Queries**: `{duplicate_hindi_queries}`\n\n")

        f.write("## 6. Ground-Truth Passage Selection Distribution\n\n")
        f.write("| Selected Relevant Passages / Query | Frequency | Percentage |\n")
        f.write("| --- | --- | --- |\n")
        for sel_count, freq in report["sample_statistics"]["selected_passages_per_query"].items():
            pct = round((freq / total_sampled) * 100, 2)
            f.write(f"| {sel_count} passage(s) | {freq:,} | {pct}% |\n")
        f.write("\n")

        f.write("## 7. Sample Hindi-English Aligned Records\n\n")
        for idx, rec in enumerate(sample_hindi_records[:3], 1):
            f.write(f"### Example {idx} (Query ID: `{rec['query_id']}`, Type: `{rec['query_type']}`)\n\n")
            f.write(f"- **Hindi Query**: `{rec['hindi_query']}`\n")
            f.write(f"- **English Query**: `{rec['english_query']}`\n")
            f.write(f"- **Hindi Ground-Truth Answer**: {rec['hindi_answer']}\n")
            f.write(f"- **English Ground-Truth Answer**: {rec['english_answer']}\n")
            f.write(f"- **Relevant Ground-Truth Passage Index**: `{rec['selected_indices']}`\n")
            f.write(f"- **Hindi Passage 0 Snippet**: *{rec['sample_hindi_passage']}...*\n\n")

    print(f"[+] Saved Markdown report to {md_path}")
    return report


if __name__ == "__main__":
    sample_sz = 5000
    if len(sys.argv) > 1:
        sample_sz = int(sys.argv[1])
    inspect_dataset(sample_size=sample_sz)
