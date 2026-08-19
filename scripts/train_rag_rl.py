"""
Multilingual Reinforcement Learning (RL) RAG Policy Training Pipeline.
Trains an RL-optimized Bi-Encoder policy across all 14 Indic languages + English
using Multi-Reward Direct Preference Optimization (DPO) & Policy Gradient Loss:
  1. Retrieval Relevance Reward (R_ret)
  2. Cross-Lingual Semantic Alignment Reward (R_align)
  3. Answer Faithfulness & Grounding Reward (R_ground)
  4. Efficiency & Latency Penalty Reward (R_eff)

Supports targeted duration training (e.g. 2-3 hours or custom steps),
continuous efficiency benchmarking, step-by-step narration, and checkpointing.
"""

import os
import sys
import time
import json
import math
import random
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Iterator, Optional
import numpy as np
import pyarrow.parquet as pq
from huggingface_hub import hf_hub_download
import torch
import torch.nn as nn
import torch.nn.functional as F
from sentence_transformers import SentenceTransformer

# Ensure root workspace is in python path
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
    "ur": ("validation/urdval.parquet", "Urdu"),
    "en": ("validation/hinval.parquet", "English")
}


class RLNarrator:
    """Provides human-readable step-by-step narration and logs progress to disk."""
    def __init__(self, log_path: str = "reports/rl_training_narration_report.md", json_path: str = "reports/rl_training_progress.json"):
        self.log_path = log_path
        self.json_path = json_path
        self.start_time = time.time()
        self.step_logs = []
        self.milestones = []
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        os.makedirs(os.path.dirname(json_path), exist_ok=True)
        
        self.narrate(
            task="RL Pipeline Initialization",
            step=0,
            narration="Reinforcement Learning training pipeline initialized. Multi-Reward Policy optimization configured across 15 languages."
        )

    def narrate(self, task: str, step: int, narration: str, metrics: Optional[Dict[str, Any]] = None):
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        elapsed_sec = time.time() - self.start_time
        elapsed_str = str(timedelta(seconds=int(elapsed_sec)))
        
        log_entry = {
            "timestamp": now,
            "elapsed": elapsed_str,
            "task": task,
            "step": step,
            "narration": narration,
            "metrics": metrics or {}
        }
        self.step_logs.append(log_entry)
        
        # Format terminal log
        print(f"\n[{now} | +{elapsed_str}] === [TASK: {task}] [STEP: {step}] ===", flush=True)
        print(f"  Narrative: {narration}", flush=True)
        if metrics:
            metrics_str = ", ".join([f"{k}: {v:.4f}" if isinstance(v, float) else f"{k}: {v}" for k, v in metrics.items()])
            print(f"  Metrics:   {metrics_str}", flush=True)
        
        self._save_reports()

    def record_milestone(self, title: str, description: str, table_data: Optional[Dict[str, Any]] = None):
        self.milestones.append({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "title": title,
            "description": description,
            "data": table_data
        })
        self._save_reports()

    def _save_reports(self):
        # Save JSON
        with open(self.json_path, "w", encoding="utf-8") as f:
            json.dump({
                "updated_at": datetime.now().isoformat(),
                "total_steps": len(self.step_logs),
                "milestones": self.milestones,
                "step_logs": self.step_logs[-500:]  # Keep last 500 in json
            }, f, indent=2, ensure_ascii=False)
            
        # Save Markdown
        with open(self.log_path, "w", encoding="utf-8") as f:
            f.write("# Multilingual Reinforcement Learning (RL) Training & Efficiency Narration\n\n")
            f.write(f"**Started At**: {self.step_logs[0]['timestamp'] if self.step_logs else 'N/A'}\n")
            f.write(f"**Last Updated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("## 1. Key Milestones\n\n")
            for m in self.milestones:
                f.write(f"### {m['title']} ({m['timestamp']})\n")
                f.write(f"{m['description']}\n\n")
                if m.get('data'):
                    f.write("```json\n" + json.dumps(m['data'], indent=2) + "\n```\n\n")
            
            f.write("## 2. Chronological Step-by-Step Narration Log\n\n")
            f.write("| Timestamp | Elapsed | Task | Step | Key Metrics | Narrative Description |\n")
            f.write("| :--- | :--- | :--- | :---: | :--- | :--- |\n")
            for entry in self.step_logs[-100:]:
                m_str = ""
                if entry.get("metrics"):
                    m_str = "<br>".join([f"**{k}**: {v:.4f}" if isinstance(v, float) else f"**{k}**: {v}" for k, v in entry["metrics"].items() if k in ["rl_loss", "dpo_loss", "reward_pos", "mrr_10", "recall_5", "p50_latency_ms"]])
                f.write(f"| {entry['timestamp']} | {entry['elapsed']} | {entry['task']} | {entry['step']} | {m_str} | {entry['narration']} |\n")


def load_parquet_records(
    repo_id: str,
    filename: str,
    max_records: int = 10000,
    batch_size: int = 1000
) -> Iterator[Dict[str, Any]]:
    """Loads records directly from local HF cache using PyArrow streaming."""
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


class RLSample:
    __slots__ = ['query', 'pos_passage', 'neg_passage', 'answer', 'lang', 'en_query']
    def __init__(self, query: str, pos_passage: str, neg_passage: str, answer: str, lang: str, en_query: str):
        self.query = query
        self.pos_passage = pos_passage
        self.neg_passage = neg_passage
        self.answer = answer
        self.lang = lang
        self.en_query = en_query


def compute_token_f1(pred_tokens: List[str], target_tokens: List[str]) -> float:
    if not pred_tokens or not target_tokens:
        return 0.0
    common = set(pred_tokens) & set(target_tokens)
    if not common:
        return 0.0
    precision = len(common) / len(pred_tokens)
    recall = len(common) / len(target_tokens)
    return (2 * precision * recall) / (precision + recall + 1e-8)


class MultiRewardFunction:
    """
    Computes a composite multi-reward signal:
      - R_ret: Retrieval rank margin
      - R_align: Cross-lingual semantic alignment
      - R_ground: Answer overlap faithfulness
      - R_eff: Normalized latency efficiency score
    """
    def __init__(
        self,
        w_ret: float = 0.45,
        w_align: float = 0.25,
        w_ground: float = 0.20,
        w_eff: float = 0.10,
        temperature: float = 0.07
    ):
        self.w_ret = w_ret
        self.w_align = w_align
        self.w_ground = w_ground
        self.w_eff = w_eff
        self.temperature = temperature

    def evaluate_batch(
        self,
        q_emb: torch.Tensor,        # (B, D)
        pos_emb: torch.Tensor,      # (B, D)
        neg_emb: torch.Tensor,      # (B, D)
        en_q_emb: Optional[torch.Tensor],  # (B, D)
        samples: List[RLSample],
        latency_ms: float
    ) -> Tuple[torch.Tensor, torch.Tensor, Dict[str, float]]:
        """
        Calculates positive and negative rewards for each sample in batch.
        Returns (r_pos, r_neg, reward_metrics_dict).
        """
        B = q_emb.shape[0]
        
        # 1. Cosine similarities
        sim_pos = F.cosine_similarity(q_emb, pos_emb, dim=-1) # (B,)
        sim_neg = F.cosine_similarity(q_emb, neg_emb, dim=-1) # (B,)
        
        # R_ret: Margin between positive and negative similarity
        margin = sim_pos - sim_neg
        r_ret_pos = torch.sigmoid(margin / self.temperature) * 1.5
        r_ret_neg = torch.sigmoid(-margin / self.temperature) * 0.2
        
        # 2. R_align: Cross-lingual alignment with English query
        if en_q_emb is not None:
            align_sim = F.cosine_similarity(q_emb, en_q_emb, dim=-1).clamp(0.0, 1.0)
            r_align_pos = align_sim
            r_align_neg = align_sim * 0.5
        else:
            r_align_pos = torch.ones(B, device=q_emb.device) * 0.8
            r_align_neg = torch.ones(B, device=q_emb.device) * 0.4

        # 3. R_ground: Token overlap faithfulness between passage and ground truth answer
        ground_scores = []
        for s in samples:
            ans_tokens = s.answer.lower().split()
            pos_tokens = s.pos_passage.lower().split()
            neg_tokens = s.neg_passage.lower().split()
            
            f1_pos = compute_token_f1(pos_tokens, ans_tokens)
            f1_neg = compute_token_f1(neg_tokens, ans_tokens)
            ground_scores.append((f1_pos, f1_neg))
            
        r_ground_pos = torch.tensor([g[0] for g in ground_scores], device=q_emb.device, dtype=torch.float32)
        r_ground_neg = torch.tensor([g[1] for g in ground_scores], device=q_emb.device, dtype=torch.float32)

        # 4. R_eff: Latency bonus (encourages fast embedding computation)
        eff_score = math.exp(-min(latency_ms, 100.0) / 25.0)
        r_eff = torch.full((B,), eff_score, device=q_emb.device, dtype=torch.float32)

        # Composite Reward
        r_total_pos = (
            self.w_ret * r_ret_pos +
            self.w_align * r_align_pos +
            self.w_ground * r_ground_pos +
            self.w_eff * r_eff
        )
        
        r_total_neg = (
            self.w_ret * r_ret_neg +
            self.w_align * r_align_neg +
            self.w_ground * r_ground_neg +
            self.w_eff * r_eff * 0.5
        )

        metrics = {
            "r_ret_pos": float(r_ret_pos.mean().item()),
            "r_align_pos": float(r_align_pos.mean().item()),
            "r_ground_pos": float(r_ground_pos.mean().item()),
            "r_eff": float(eff_score),
            "reward_pos_mean": float(r_total_pos.mean().item()),
            "reward_neg_mean": float(r_total_neg.mean().item()),
            "sim_margin": float(margin.mean().item())
        }
        
        return r_total_pos, r_total_neg, metrics


class RLBiEncoderPolicy(nn.Module):
    """
    Trainable Bi-Encoder Policy wrapping Transformer backbone with mean pooling and L2 normalization.
    """
    def __init__(self, base_model_name: str, device: str = "cuda"):
        super().__init__()
        self.device = device
        print(f"[*] Loading RL Policy Backbone from: {base_model_name} on {device}...", flush=True)
        st_model = SentenceTransformer(base_model_name, device=device)
        self.transformer = st_model[0].auto_model
        self.tokenizer = st_model.tokenizer
        self.to(device)

    def forward(self, texts: List[str], max_length: int = 256) -> torch.Tensor:
        inputs = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt"
        ).to(self.device)
        
        outputs = self.transformer(**inputs)
        # Mean Pooling with attention mask
        token_embeddings = outputs[0]
        input_mask_expanded = inputs['attention_mask'].unsqueeze(-1).expand(token_embeddings.size()).float()
        sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
        sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
        pooled = sum_embeddings / sum_mask
        # L2 Normalize
        normalized = F.normalize(pooled, p=2, dim=1)
        return normalized

    def save_policy(self, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)
        self.transformer.save_pretrained(output_dir)
        self.tokenizer.save_pretrained(output_dir)
        # Also write sentence_bert_config
        sbert_config = {
            "max_seq_length": 256,
            "do_lower_case": False
        }
        with open(os.path.join(output_dir, "sentence_bert_config.json"), "w", encoding="utf-8") as f:
            json.dump(sbert_config, f, indent=2)
            
        modules_config = [
            {"name": "0", "type": "sentence_transformers.models.Transformer", "path": ""},
            {"name": "1", "type": "sentence_transformers.models.Pooling", "path": "1_Pooling"}
        ]
        with open(os.path.join(output_dir, "modules.json"), "w", encoding="utf-8") as f:
            json.dump(modules_config, f, indent=2)
            
        # Create 1_Pooling dir and config
        pool_dir = os.path.join(output_dir, "1_Pooling")
        os.makedirs(pool_dir, exist_ok=True)
        with open(os.path.join(pool_dir, "config.json"), "w", encoding="utf-8") as f:
            json.dump({
                "pooling_mode_cls_token": False,
                "pooling_mode_mean_tokens": True,
                "pooling_mode_max_tokens": False,
                "pooling_mode_mean_sqrt_len_tokens": False,
                "word_embedding_dimension": 384
            }, f, indent=2)


def collect_rl_dataset(
    repo_id: str = "ai4bharat/MSMARCO-XI",
    languages: List[str] = None,
    samples_per_lang: int = 2500
) -> List[RLSample]:
    """Extracts paired (Query, Pos_Passage, Neg_Passage, Answer, Lang, En_Query) samples."""
    langs = languages or list(DATASET_SHARDS.keys())
    all_samples = []
    
    print(f"\n[*] Streaming RL dataset across {len(langs)} languages from {repo_id} (Target: ~{samples_per_lang} samples/lang)...", flush=True)
    
    for lang in langs:
        rel_path, lang_name = DATASET_SHARDS.get(lang, (None, lang))
        if not rel_path:
            continue
        
        is_english = (lang == "en")
        start_t = time.time()
        records = list(load_parquet_records(repo_id, rel_path, max_records=samples_per_lang + 300))
        if not records:
            continue
            
        lang_samples = 0
        all_lang_passages = []
        
        # Pre-extract passages for hard negative fallback
        for r in records:
            passages_obj = r.get("passages") or {}
            p_list = passages_obj.get("English_passages" if is_english else "Translated_passages") or []
            for p in p_list:
                if p and len(str(p).strip()) > 20:
                    all_lang_passages.append(str(p).strip())
                    
        for row in records:
            q_text = str(row.get("Eng_Query" if is_english else "query") or "").strip()
            ans_text = str(row.get("Eng_Answer" if is_english else "Answer") or "").strip()
            en_q_text = str(row.get("Eng_Query") or "").strip()
            
            passages_obj = row.get("passages") or {}
            p_list = passages_obj.get("English_passages" if is_english else "Translated_passages") or []
            is_selected = passages_obj.get("is_selected") or []
            
            if not q_text or not p_list:
                continue
                
            pos_candidates = [str(p).strip() for p, sel in zip(p_list, is_selected) if sel == 1 and str(p).strip()]
            neg_candidates = [str(p).strip() for p, sel in zip(p_list, is_selected) if sel == 0 and str(p).strip()]
            
            if not pos_candidates:
                continue
                
            pos = pos_candidates[0]
            if neg_candidates:
                neg = neg_candidates[0]
            elif all_lang_passages:
                neg = random.choice(all_lang_passages)
            else:
                neg = "Informational text not related to this query."
                
            all_samples.append(RLSample(
                query=q_text,
                pos_passage=pos,
                neg_passage=neg,
                answer=ans_text if ans_text else pos[:150],
                lang=lang,
                en_query=en_q_text if en_q_text else q_text
            ))
            lang_samples += 1
            if lang_samples >= samples_per_lang:
                break
                
        elapsed = time.time() - start_t
        print(f"  [+] {lang_name.upper()} ({lang}): Loaded {lang_samples} RL samples in {elapsed:.2f}s", flush=True)
        
    random.shuffle(all_samples)
    print(f"[+] Total Multilingual RL Training Samples Loaded: {len(all_samples):,}", flush=True)
    return all_samples


def quick_efficiency_eval(
    policy: RLBiEncoderPolicy,
    narrator: RLNarrator,
    eval_langs: List[str] = ["hi", "bn", "mr", "ta", "te", "gu", "en"],
    samples_per_lang: int = 150
) -> Dict[str, Any]:
    """Runs a fast multi-language efficiency check measuring Recall@1, Recall@5, MRR@10, and Latencies."""
    policy.eval()
    results = {}
    total_mrr = []
    total_r1 = []
    total_r5 = []
    latencies = []
    
    with torch.no_grad():
        for lang in eval_langs:
            rel_path, lang_name = DATASET_SHARDS.get(lang, (None, lang))
            if not rel_path:
                continue
                
            is_english = (lang == "en")
            records = list(load_parquet_records("ai4bharat/MSMARCO-XI", rel_path, max_records=samples_per_lang + 50))
            if not records:
                continue
                
            queries = []
            passages = []
            for r in records:
                q = str(r.get("Eng_Query" if is_english else "query") or "").strip()
                passages_obj = r.get("passages") or {}
                p_list = passages_obj.get("English_passages" if is_english else "Translated_passages") or []
                is_sel = passages_obj.get("is_selected") or []
                
                pos_list = [str(p).strip() for p, sel in zip(p_list, is_sel) if sel == 1 and str(p).strip()]
                if q and pos_list:
                    queries.append(q)
                    passages.append(pos_list[0])
                    if len(queries) >= samples_per_lang:
                        break
                        
            if len(queries) < 2:
                continue
                
            t0 = time.perf_counter()
            q_emb = policy(queries).cpu().numpy()
            p_emb = policy(passages).cpu().numpy()
            batch_time_ms = (time.perf_counter() - t0) * 1000
            q_time_ms = batch_time_ms / len(queries)
            latencies.append(q_time_ms)
            
            # Compute cosine similarity matrix
            sim_mat = np.dot(q_emb, p_emb.T) # (N, N)
            
            r1_cnt = 0
            r5_cnt = 0
            mrr_sum = 0.0
            N = len(queries)
            
            for i in range(N):
                ranked = np.argsort(-sim_mat[i])
                rank = np.where(ranked == i)[0]
                if len(rank) > 0:
                    r = rank[0] + 1
                    if r == 1:
                        r1_cnt += 1
                    if r <= 5:
                        r5_cnt += 1
                    if r <= 10:
                        mrr_sum += 1.0 / r
                        
            r1 = (r1_cnt / N) * 100.0
            r5 = (r5_cnt / N) * 100.0
            mrr = mrr_sum / N
            
            results[lang] = {
                "name": lang_name,
                "recall_1": round(r1, 2),
                "recall_5": round(r5, 2),
                "mrr_10": round(mrr, 4),
                "latency_per_query_ms": round(q_time_ms, 2)
            }
            total_r1.append(r1)
            total_r5.append(r5)
            total_mrr.append(mrr)
            
    policy.train()
    
    if not total_r1:
        return {
            "macro_recall_1": 0.0,
            "macro_recall_5": 0.0,
            "macro_mrr_10": 0.0,
            "p50_latency_ms": 0.0,
            "p95_latency_ms": 0.0,
            "languages_evaluated": 0,
            "per_language": {}
        }
        
    summary = {
        "macro_recall_1": round(float(np.mean(total_r1)), 2),
        "macro_recall_5": round(float(np.mean(total_r5)), 2),
        "macro_mrr_10": round(float(np.mean(total_mrr)), 4),
        "p50_latency_ms": round(float(np.median(latencies)), 2),
        "p95_latency_ms": round(float(np.percentile(latencies, 95)), 2),
        "languages_evaluated": len(results),
        "per_language": results
    }
    return summary


def train_rl_policy(
    base_model: str = "models/msmarco-xi-multilingual-biencoder",
    output_dir: str = "models/msmarco-xi-multilingual-rl-biencoder",
    checkpoint_dir: str = "checkpoints/rl_policy",
    target_hours: float = 2.5,
    max_steps: Optional[int] = None,
    batch_size: int = 32,
    lr: float = 2e-5,
    beta_dpo: float = 0.15,
    kl_weight: float = 0.05,
    eval_interval_steps: int = 150,
    save_interval_steps: int = 300,
    samples_per_lang: int = 2500
):
    """
    Main Reinforcement Learning Training Loop.
    Executes continuous Multi-Reward DPO Policy Optimization for targeted duration (2-3 hours).
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"
    os.makedirs(checkpoint_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    
    narrator = RLNarrator()
    
    narrator.narrate(
        task="RL System Initialization",
        step=0,
        narration=f"Initializing RL Policy Training on device [{device.upper()}]. Target training duration: {target_hours} hours ({target_hours*3600:.0f} seconds).",
        metrics={"target_hours": target_hours, "batch_size": batch_size, "lr": lr, "beta_dpo": beta_dpo, "kl_weight": kl_weight}
    )
    
    # 1. Initialize Trainable Policy and Frozen Reference Policy (for KL Penalty)
    policy_base = base_model if os.path.exists(base_model) else "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    policy = RLBiEncoderPolicy(policy_base, device=device)
    
    print("[*] Creating frozen Reference Policy for KL Divergence regularization...", flush=True)
    ref_policy = RLBiEncoderPolicy(policy_base, device=device)
    ref_policy.eval()
    for param in ref_policy.parameters():
        param.requires_grad = False
        
    reward_fn = MultiRewardFunction()
    optimizer = torch.optim.AdamW(policy.parameters(), lr=lr, weight_decay=0.01)
    
    # 2. Collect Training Dataset across all languages
    narrator.narrate(
        task="Dataset Ingestion & Preparation",
        step=0,
        narration="Streaming and caching cross-lingual dataset across all 14 Indian languages + English from AI4Bharat MSMARCO-XI."
    )
    
    rl_samples = collect_rl_dataset(samples_per_lang=samples_per_lang)
    num_samples = len(rl_samples)
    if num_samples == 0:
        print("[!] No training samples found. Aborting.")
        return
        
    total_batches = (num_samples + batch_size - 1) // batch_size
    
    # 3. Initial Baseline Efficiency Evaluation
    narrator.narrate(
        task="Baseline Efficiency Benchmark",
        step=0,
        narration="Running baseline multi-language retrieval efficiency benchmark before RL optimization starts."
    )
    baseline_eval = quick_efficiency_eval(policy, narrator)
    narrator.record_milestone(
        title="Baseline Multi-Language Efficiency",
        description=f"Initial baseline across Indic languages: Recall@1: {baseline_eval['macro_recall_1']}%, Recall@5: {baseline_eval['macro_recall_5']}%, MRR@10: {baseline_eval['macro_mrr_10']:.4f}, p50 Latency: {baseline_eval['p50_latency_ms']} ms.",
        table_data=baseline_eval
    )
    
    # 4. Training Loop setup
    start_time = time.time()
    target_seconds = target_hours * 3600
    step = 0
    epoch = 0
    scaler = torch.cuda.amp.GradScaler(enabled=(device == "cuda"))
    
    narrator.narrate(
        task="RL Policy Training Start",
        step=1,
        narration=f"Entering RL Policy Training Loop. Epochs will dynamically rotate through language pairs, optimizing Multi-Reward DPO gradients."
    )
    
    while True:
        epoch += 1
        random.shuffle(rl_samples)
        epoch_loss = 0.0
        epoch_r_pos = 0.0
        epoch_r_neg = 0.0
        epoch_sim_margin = 0.0
        epoch_steps = 0
        
        narrator.narrate(
            task=f"RL Epoch {epoch} Launch",
            step=step,
            narration=f"Starting RL Training Epoch {epoch} covering all 15 languages ({num_samples:,} samples, {total_batches} batches)."
        )
        
        for b_idx in range(0, num_samples, batch_size):
            step += 1
            batch = rl_samples[b_idx:b_idx + batch_size]
            B = len(batch)
            if B < 2:
                continue
                
            queries = [s.query for s in batch]
            pos_passages = [s.pos_passage for s in batch]
            neg_passages = [s.neg_passage for s in batch]
            en_queries = [s.en_query for s in batch]
            
            optimizer.zero_grad()
            t_batch_start = time.perf_counter()
            
            with torch.cuda.amp.autocast(enabled=(device == "cuda")):
                # Policy Embeddings
                q_emb = policy(queries)
                pos_emb = policy(pos_passages)
                neg_emb = policy(neg_passages)
                
                with torch.no_grad():
                    en_q_emb = policy(en_queries)
                    # Reference Policy Embeddings for KL Divergence
                    ref_q_emb = ref_policy(queries)
                
                batch_latency_ms = (time.perf_counter() - t_batch_start) * 1000
                
                # Multi-Reward Evaluation
                with torch.no_grad():
                    r_pos, r_neg, r_metrics = reward_fn.evaluate_batch(
                        q_emb, pos_emb, neg_emb, en_q_emb, batch, batch_latency_ms
                    )
                    reward_delta = (r_pos - r_neg) # (B,)
                    
                # Policy Similarity Logits
                sim_pos = F.cosine_similarity(q_emb, pos_emb, dim=-1) # (B,)
                sim_neg = F.cosine_similarity(q_emb, neg_emb, dim=-1) # (B,)
                
                # DPO-style Policy Gradient Ranking Loss:
                logits_diff = (sim_pos - sim_neg) / 0.07
                scaled_pref = beta_dpo * reward_delta * logits_diff
                dpo_loss = -torch.mean(F.logsigmoid(scaled_pref))
                
                # KL Divergence Regularization against Reference Policy
                kl_div = F.mse_loss(q_emb, ref_q_emb)
                
                total_loss = dpo_loss + kl_weight * kl_div
                
            # Backprop with AMP
            scaler.scale(total_loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(policy.parameters(), max_norm=1.0)
            scaler.step(optimizer)
            scaler.update()
            
            loss_val = total_loss.item()
            epoch_loss += loss_val
            epoch_r_pos += r_metrics["reward_pos_mean"]
            epoch_r_neg += r_metrics["reward_neg_mean"]
            epoch_sim_margin += r_metrics["sim_margin"]
            epoch_steps += 1
            
            # Step Narration every 25 steps
            if step % 25 == 0:
                elapsed_sec = time.time() - start_time
                progress_pct = min(100.0, (elapsed_sec / target_seconds) * 100.0) if target_seconds > 0 else 0.0
                
                narrator.narrate(
                    task=f"RL Optimization (Epoch {epoch})",
                    step=step,
                    narration=f"Processed batch {epoch_steps}/{total_batches} [{progress_pct:.1f}% time elapsed]. Policy alignment margin: {r_metrics['sim_margin']:.4f}, Positive Reward: {r_metrics['reward_pos_mean']:.4f}, DPO Loss: {dpo_loss.item():.4f}, KL Div: {kl_div.item():.5f}.",
                    metrics={
                        "rl_loss": loss_val,
                        "dpo_loss": dpo_loss.item(),
                        "kl_div": kl_div.item(),
                        "reward_pos": r_metrics["reward_pos_mean"],
                        "reward_neg": r_metrics["reward_neg_mean"],
                        "sim_margin": r_metrics["sim_margin"],
                        "r_ret": r_metrics["r_ret_pos"],
                        "r_align": r_metrics["r_align_pos"],
                        "r_ground": r_metrics["r_ground_pos"],
                        "r_eff": r_metrics["r_eff"]
                    }
                )
                
            # Periodic Efficiency Check
            if step % eval_interval_steps == 0:
                narrator.narrate(
                    task="Periodic RAG Efficiency Check",
                    step=step,
                    narration=f"Executing periodic multi-lingual efficiency evaluation at step {step}."
                )
                eval_summary = quick_efficiency_eval(policy, narrator)
                narrator.narrate(
                    task="Efficiency Check Results",
                    step=step,
                    narration=f"Current Multilingual Policy Performance -> Recall@1: {eval_summary['macro_recall_1']}%, Recall@5: {eval_summary['macro_recall_5']}%, MRR@10: {eval_summary['macro_mrr_10']:.4f}, p50 Latency: {eval_summary['p50_latency_ms']} ms.",
                    metrics={
                        "recall_1": eval_summary["macro_recall_1"],
                        "recall_5": eval_summary["macro_recall_5"],
                        "mrr_10": eval_summary["macro_mrr_10"],
                        "p50_latency_ms": eval_summary["p50_latency_ms"]
                    }
                )
                
            # Periodic Checkpoint Saving
            if step % save_interval_steps == 0:
                ckpt_path = os.path.join(checkpoint_dir, f"rl_policy_step_{step}.pt")
                torch.save({
                    "step": step,
                    "epoch": epoch,
                    "model_state_dict": policy.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "metrics": r_metrics
                }, ckpt_path)
                # Also update active model
                policy.save_policy(output_dir)
                narrator.narrate(
                    task="Checkpoint & Model Persistence",
                    step=step,
                    narration=f"Saved intermediate RL checkpoint to '{ckpt_path}' and updated active model at '{output_dir}'."
                )
                
            # Check duration or step limits
            elapsed_sec = time.time() - start_time
            if target_seconds and elapsed_sec >= target_seconds:
                narrator.narrate(
                    task="Target Training Duration Reached",
                    step=step,
                    narration=f"Target training duration of {target_hours} hours reached ({elapsed_sec/3600:.2f} hours total). Finalizing model."
                )
                break
                
            if max_steps and step >= max_steps:
                narrator.narrate(
                    task="Max Steps Reached",
                    step=step,
                    narration=f"Reached maximum requested steps ({max_steps}). Finalizing training."
                )
                break
                
        # Epoch Summary
        avg_loss = epoch_loss / max(1, epoch_steps)
        avg_r_pos = epoch_r_pos / max(1, epoch_steps)
        avg_r_neg = epoch_r_neg / max(1, epoch_steps)
        avg_margin = epoch_sim_margin / max(1, epoch_steps)
        
        narrator.narrate(
            task=f"RL Epoch {epoch} Completed",
            step=step,
            narration=f"Epoch {epoch} finished. Average Loss: {avg_loss:.4f}, Mean Positive Reward: {avg_r_pos:.4f}, Mean Negative Reward: {avg_r_neg:.4f}, Average Margin: {avg_margin:.4f}.",
            metrics={
                "epoch": epoch,
                "avg_loss": avg_loss,
                "avg_r_pos": avg_r_pos,
                "avg_r_neg": avg_r_neg,
                "avg_margin": avg_margin
            }
        )
        
        elapsed_sec = time.time() - start_time
        if (target_seconds and elapsed_sec >= target_seconds) or (max_steps and step >= max_steps):
            break
            
    # 5. Final Save & Comprehensive Post-Training Efficiency Benchmark
    narrator.narrate(
        task="Final Model Persistence",
        step=step,
        narration=f"Exporting finalized Reinforcement Learning Policy weights to '{output_dir}'."
    )
    policy.save_policy(output_dir)
    
    narrator.narrate(
        task="Final Comprehensive Multi-Language Evaluation",
        step=step,
        narration="Running final post-training multilingual efficiency benchmark across all languages."
    )
    final_eval = quick_efficiency_eval(
        policy,
        narrator,
        eval_langs=list(DATASET_SHARDS.keys()),
        samples_per_lang=250
    )
    
    narrator.record_milestone(
        title="Final Post-RL Multi-Language Efficiency Benchmark",
        description=f"RL Policy Optimization Complete. Final Macro Recall@1: {final_eval['macro_recall_1']}%, Recall@5: {final_eval['macro_recall_5']}%, MRR@10: {final_eval['macro_mrr_10']:.4f}, p50 Latency: {final_eval['p50_latency_ms']} ms across {final_eval['languages_evaluated']} languages.",
        table_data=final_eval
    )
    
    narrator.narrate(
        task="RL Pipeline Completion",
        step=step,
        narration=f"Reinforcement Learning Training Pipeline successfully concluded after {step} steps. Model is active at '{output_dir}'."
    )
    print("\n[+] Reinforcement Learning Training Pipeline Finished Successfully!", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Multilingual RL Policy Training for RAG")
    parser.add_argument("--base_model", type=str, default="models/msmarco-xi-multilingual-biencoder", help="Path or HF ID of base model")
    parser.add_argument("--output_dir", type=str, default="models/msmarco-xi-multilingual-rl-biencoder", help="Output model directory")
    parser.add_argument("--checkpoint_dir", type=str, default="checkpoints/rl_policy", help="Checkpoint directory")
    parser.add_argument("--target_hours", type=float, default=2.5, help="Training duration in hours (e.g. 2.0 to 3.0)")
    parser.add_argument("--max_steps", type=int, default=None, help="Optional maximum steps limit")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=2e-5, help="Learning rate")
    parser.add_argument("--beta_dpo", type=float, default=0.15, help="DPO temperature beta")
    parser.add_argument("--kl_weight", type=float, default=0.05, help="KL divergence regularization weight")
    parser.add_argument("--samples_per_lang", type=int, default=2500, help="Training samples per language shard")
    parser.add_argument("--eval_interval", type=int, default=150, help="Steps between efficiency checks")
    parser.add_argument("--save_interval", type=int, default=300, help="Steps between checkpoint saves")
    
    args = parser.parse_args()
    
    train_rl_policy(
        base_model=args.base_model,
        output_dir=args.output_dir,
        checkpoint_dir=args.checkpoint_dir,
        target_hours=args.target_hours,
        max_steps=args.max_steps,
        batch_size=args.batch_size,
        lr=args.lr,
        beta_dpo=args.beta_dpo,
        kl_weight=args.kl_weight,
        eval_interval_steps=args.eval_interval,
        save_interval_steps=args.save_interval,
        samples_per_lang=args.samples_per_lang
    )
