"""
Multilingual RAG Bi-Encoder Training Pipeline for AI4Bharat MSMARCO-XI.
Trains a SentenceTransformer embedding model across all 14 Indic language splits + English
using Multiple Negatives Ranking Loss (MNRL) on GPU with PyTorch CUDA acceleration.
Outputs fine-tuned weights to models/msmarco-xi-multilingual-biencoder/.
"""

import os
import sys
import time
import json
import random
import argparse
from typing import List, Dict, Any, Iterator, Tuple
import pyarrow.parquet as pq
from huggingface_hub import hf_hub_download
import torch
from torch.utils.data import DataLoader
from sentence_transformers import SentenceTransformer, InputExample, losses, evaluation

# Ensure root workspace directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# UTF-8 stdout configuration for Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

DATASET_SHARDS = {
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
    max_records: int = 20000,
    batch_size: int = 1000
) -> Iterator[Dict[str, Any]]:
    """Downloads parquet file via HuggingFace Hub and streams rows efficiently using PyArrow."""
    try:
        local_path = hf_hub_download(repo_id=repo_id, filename=filename, repo_type="dataset")
    except Exception as e:
        print(f"[!] Error loading {filename}: {e}", flush=True)
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


def collect_multilingual_training_data(
    languages: List[str] = None,
    train_samples_per_lang: int = 5000,
    eval_samples_per_lang: int = 150,
    include_cross_lingual: bool = True
) -> Tuple:
    """Extracts training pairs and evaluation benchmarks across all Indic languages + English."""
    selected_langs = languages or list(DATASET_SHARDS.keys())
    train_examples = []
    
    eval_queries = {}
    eval_corpus = {}
    eval_relevant_docs = {}
    doc_id_counter = 0

    print(f"\n[*] Collecting training & validation data across {len(selected_langs)} languages...", flush=True)

    for lang in selected_langs:
        rel_path, lang_name = DATASET_SHARDS.get(lang, (None, lang))
        if not rel_path:
            continue

        print(f"[*] Processing {lang_name.upper()} ({rel_path})...", flush=True)
        lang_train_count = 0
        lang_eval_count = 0
        start_t = time.time()

        for row in load_parquet_records("ai4bharat/MSMARCO-XI", rel_path, max_records=(train_samples_per_lang + eval_samples_per_lang) * 2):
            q_indic = (row.get("query") or "").strip()
            q_en = (row.get("Eng_Query") or "").strip()
            passages = row.get("passages") or {}
            tr_passages = passages.get("Translated_passages") or []
            en_passages = passages.get("English_passages") or []
            is_selected = passages.get("is_selected") or []

            # Determine whether to allocate to train or eval
            is_eval = (lang_eval_count < eval_samples_per_lang and random.random() < 0.15)

            if is_eval:
                q_id = f"{lang}_eval_q_{row.get('query_id', lang_eval_count)}"
                has_selected = False
                for p_text, sel in zip(tr_passages, is_selected):
                    if not p_text or len(str(p_text).strip()) < 15:
                        continue
                    doc_id = f"doc_{doc_id_counter}"
                    doc_id_counter += 1
                    eval_corpus[doc_id] = str(p_text).strip()
                    if sel == 1 and not has_selected:
                        eval_queries[q_id] = q_indic
                        eval_relevant_docs[q_id] = {doc_id}
                        has_selected = True

                if has_selected:
                    lang_eval_count += 1
            else:
                if lang_train_count >= train_samples_per_lang:
                    continue

                for idx, selected in enumerate(is_selected):
                    if selected == 1:
                        # 1. Target Indic Query -> Target Indic Passage
                        if q_indic and idx < len(tr_passages) and tr_passages[idx]:
                            pos_text = str(tr_passages[idx]).strip()
                            if len(pos_text) > 15:
                                train_examples.append(InputExample(texts=[q_indic, pos_text]))
                                lang_train_count += 1

                        # 2. Cross-Lingual: Target Indic Query -> English Passage
                        if include_cross_lingual and q_indic and idx < len(en_passages) and en_passages[idx]:
                            pos_en_text = str(en_passages[idx]).strip()
                            if len(pos_en_text) > 15:
                                train_examples.append(InputExample(texts=[q_indic, pos_en_text]))
                                lang_train_count += 1

                        # 3. Cross-Lingual: English Query -> Target Indic Passage
                        if include_cross_lingual and q_en and idx < len(tr_passages) and tr_passages[idx]:
                            pos_text = str(tr_passages[idx]).strip()
                            if len(pos_text) > 15:
                                train_examples.append(InputExample(texts=[q_en, pos_text]))
                                lang_train_count += 1
                        break

            if lang_train_count >= train_samples_per_lang and lang_eval_count >= eval_samples_per_lang:
                break

        print(f"    [+] Loaded {lang_train_count:,} train pairs + {lang_eval_count} eval queries for {lang_name.upper()} in {time.time() - start_t:.2f}s", flush=True)

    return train_examples, {
        "queries": eval_queries,
        "corpus": eval_corpus,
        "relevant_docs": eval_relevant_docs
    }


def train_msmarco_model(
    base_model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    output_dir: str = "models/msmarco-xi-multilingual-biencoder",
    languages: List[str] = None,
    samples_per_lang: int = 5000,
    batch_size: int = 32,
    epochs: int = 1,
    learning_rate: float = 2e-5,
    warmup_steps: int = 100,
    eval_steps: int = 300
):
    print("=" * 80, flush=True)
    print("       AI4BHARAT MSMARCO-XI MULTILINGUAL RAG BI-ENCODER TRAINING       ", flush=True)
    print("=" * 80, flush=True)
    print(f"[*] Base Model: {base_model_name}", flush=True)
    print(f"[*] Target Output Directory: {output_dir}", flush=True)
    print(f"[*] Target Languages: {languages or list(DATASET_SHARDS.keys())}", flush=True)
    print(f"[*] Samples per Language: {samples_per_lang:,}", flush=True)
    print(f"[*] Batch Size: {batch_size}, Epochs: {epochs}, LR: {learning_rate}", flush=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[*] Training Device: {device.upper()}", flush=True)
    if device == "cuda":
        print(f"[+] GPU: {torch.cuda.get_device_name(0)}", flush=True)
        print(f"[+] GPU VRAM Total: {torch.cuda.get_device_properties(0).total_memory / (1024**2):.1f} MB", flush=True)

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs("reports", exist_ok=True)

    # 1. Load Pretrained SentenceTransformer
    print(f"\n[*] Loading base model: {base_model_name} on {device.upper()}...", flush=True)
    model = SentenceTransformer(base_model_name, device=device)

    # 2. Collect Training & Validation Data
    train_examples, eval_data = collect_multilingual_training_data(
        languages=languages,
        train_samples_per_lang=samples_per_lang,
        eval_samples_per_lang=100,
        include_cross_lingual=True
    )

    if not train_examples:
        raise ValueError("No training examples were generated. Please check dataset connection.")

    print(f"\n[+] Total Training Examples Collected: {len(train_examples):,}", flush=True)
    random.seed(42)
    random.shuffle(train_examples)

    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=batch_size, drop_last=True)

    # 3. Define MultipleNegativesRankingLoss
    train_loss = losses.MultipleNegativesRankingLoss(model=model)

    # 4. Prepare Validation Evaluator
    evaluator = None
    if eval_data["queries"] and eval_data["corpus"]:
        print(f"[+] Configured validation evaluator with {len(eval_data['queries']):,} queries and {len(eval_data['corpus']):,} passages.", flush=True)
        evaluator = evaluation.InformationRetrievalEvaluator(
            queries=eval_data["queries"],
            corpus=eval_data["corpus"],
            relevant_docs=eval_data["relevant_docs"],
            name="msmarco_xi_multilingual_val",
            mrr_at_k=[1, 5, 10],
            ndcg_at_k=[1, 5, 10],
            accuracy_at_k=[1, 5, 10],
            precision_recall_at_k=[1, 5, 10],
            show_progress_bar=True
        )

    # 5. Run Training
    print(f"\n[*] Commencing Model Training for {epochs} epoch(s) on {device.upper()} ({len(train_dataloader):,} steps)...", flush=True)
    start_train_time = time.time()

    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        evaluator=evaluator,
        epochs=epochs,
        steps_per_epoch=len(train_dataloader),
        warmup_steps=warmup_steps,
        optimizer_params={"lr": learning_rate},
        output_path=output_dir,
        evaluation_steps=eval_steps,
        save_best_model=True if evaluator else False,
        show_progress_bar=True,
        use_amp=True if device == "cuda" else False
    )

    total_training_time = round(time.time() - start_train_time, 2)
    print(f"\n[✓] Training complete! Saved fine-tuned model checkpoint to: {output_dir}", flush=True)
    print(f"[✓] Total training duration: {total_training_time}s", flush=True)

    # 6. Save Training Metadata & Metrics Report
    report = {
        "base_model": base_model_name,
        "output_dir": output_dir,
        "device": device,
        "gpu_name": torch.cuda.get_device_name(0) if device == "cuda" else "N/A",
        "training_duration_seconds": total_training_time,
        "total_training_pairs": len(train_examples),
        "target_languages": languages or list(DATASET_SHARDS.keys()),
        "hyperparameters": {
            "batch_size": batch_size,
            "epochs": epochs,
            "learning_rate": learning_rate,
            "warmup_steps": warmup_steps,
            "loss_function": "MultipleNegativesRankingLoss"
        },
        "completed_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }

    with open("reports/training_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return model, report


if __name__ == "__main__":
    from typing import Tuple
    parser = argparse.ArgumentParser(description="Train Multilingual RAG Bi-Encoder on MSMARCO-XI")
    parser.add_argument("--base_model", type=str, default="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    parser.add_argument("--output_dir", type=str, default="models/msmarco-xi-multilingual-biencoder")
    parser.add_argument("--samples_per_lang", type=int, default=5000, help="Number of query pairs per language")
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--langs", type=str, default="all", help="Comma-separated language codes or 'all'")
    args = parser.parse_args()

    target_langs = None if args.langs == "all" else [l.strip() for l in args.langs.split(",")]
    train_msmarco_model(
        base_model_name=args.base_model,
        output_dir=args.output_dir,
        languages=target_langs,
        samples_per_lang=args.samples_per_lang,
        batch_size=args.batch_size,
        epochs=args.epochs,
        learning_rate=args.lr
    )
