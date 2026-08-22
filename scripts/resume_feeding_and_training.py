"""
Unified Pipeline Orchestrator: Resume Dataset Ingestion and Multilingual Training.
Orchestrates:
  1. Resuming GPU-accelerated dataset ingestion across remaining Indic language shards
     (Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Sanskrit, Nepali)
  2. Dataset indexing audit and verification
  3. Resuming Multilingual RAG Bi-Encoder & RL Policy Optimization Training
"""

import os
import sys
import time
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def run_step(step_name: str, cmd: list):
    print("\n" + "=" * 80)
    print(f"🚀 PIPELINE STEP: {step_name}")
    print(f"[*] Command: {' '.join(cmd)}")
    print("=" * 80 + "\n", flush=True)
    
    start_t = time.perf_counter()
    proc = subprocess.Popen(
        cmd,
        cwd=str(PROJECT_ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        bufsize=1
    )
    
    for line in iter(proc.stdout.readline, ''):
        print(line, end='', flush=True)
        
    proc.stdout.close()
    return_code = proc.wait()
    elapsed = time.perf_counter() - start_t
    
    if return_code != 0:
        print(f"\n[!] Step '{step_name}' exited with error code {return_code} after {elapsed:.1f}s", flush=True)
        return False
    else:
        print(f"\n[✓] Step '{step_name}' finished successfully in {elapsed/60:.2f}m ({elapsed:.1f}s)", flush=True)
        return True


def main():
    print("==========================================================================")
    print("🌟 AUTOMATED PIPELINE: RESUME DATASET FEEDING & MULTILINGUAL TRAINING")
    print("==========================================================================")
    
    # 1. Resume Dataset Ingestion
    print("\n[Phase 1/3] Resuming Ingestion for In-Progress and Pending Shards...")
    ingest_success = run_step(
        "Multilingual Dataset Ingestion (FAISS + SQLite + BM25)",
        [sys.executable, "scripts/ingest_remaining_languages.py", "--limit-per-shard", "97941", "--batch-size", "256", "--embed-batch-size", "256"]
    )
    
    if not ingest_success:
        print("[!] Ingestion encountered an error. Checking current status...")
        
    # 2. Check and Print Dataset Audit
    print("\n[Phase 2/3] Generating Ingestion Progress Audit...")
    run_step(
        "Dataset Audit & Verification",
        [sys.executable, "scripts/dataset_progress_report.py"]
    )
    
    # 3. Resume Multilingual Training
    print("\n[Phase 3/3] Resuming Multilingual RAG Model Training & RL Policy...")
    train_success = run_step(
        "Multilingual RL Policy & Bi-Encoder Training",
        [sys.executable, "scripts/train_rag_rl.py", "--target_hours", "2.0", "--batch_size", "32", "--samples_per_lang", "2500"]
    )
    
    print("\n==========================================================================")
    print("🎉 FULL DATASET FEEDING AND TRAINING PIPELINE COMPLETED")
    print("==========================================================================")


if __name__ == "__main__":
    main()
