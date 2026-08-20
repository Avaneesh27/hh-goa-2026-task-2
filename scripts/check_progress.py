import os
import sys
import json
from glob import glob

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def check_progress():
    print("================================================================")
    print("[*] DATASET INGESTION & INDEXING PROGRESS SUMMARY")
    print("================================================================")
    
    total_rows = 0
    total_chunks = 0
    completed_shards = 0
    in_progress_shards = 0
    
    files = sorted(glob("checkpoints/*.json"))
    if not files:
        print("No checkpoint files found in checkpoints/")
        return
        
    for f in files:
        try:
            d = json.load(open(f, "r", encoding="utf-8"))
            shard = d.get("shard", f)
            rows = d.get("last_row", 0)
            chunks = d.get("total_chunks", 0)
            status = d.get("status", "unknown")
            
            total_rows += rows
            total_chunks += chunks
            if status == "completed":
                completed_shards += 1
            else:
                in_progress_shards += 1
                
            status_icon = "✓" if status == "completed" else "↻"
            print(f"[{status_icon}] {shard:<30} | Rows: {rows:>8,} | Chunks: {chunks:>8,} | Status: {status}")
        except Exception as e:
            print(f"[!] Error reading {f}: {e}")
            
    print("----------------------------------------------------------------")
    print(f"Total Rows Processed:   {total_rows:>10,}")
    print(f"Total Chunks Generated: {total_chunks:>10,}")
    print(f"Completed Shards:       {completed_shards} / {len(files)}")
    print(f"In-Progress Shards:     {in_progress_shards}")
    print("================================================================")

if __name__ == "__main__":
    check_progress()
