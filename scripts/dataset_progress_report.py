import os
import sys
import json
from glob import glob

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SHARD_METADATA = [
    ("validation/hinval.parquet", "Hindi", 97941),
    ("validation/marval.parquet", "Marathi", 97941),
    ("validation/benval.parquet", "Bengali", 97941),
    ("validation/tamval.parquet", "Tamil", 97941),
    ("validation/telval.parquet", "Telugu", 97941),
    ("validation/gujval.parquet", "Gujarati", 97941),
    ("validation/kanval.parquet", "Kannada", 97941),
    ("validation/malval.parquet", "Malayalam", 97941),
    ("validation/panval.parquet", "Punjabi", 97941),
    ("validation/orival.parquet", "Odia", 97941),
    ("validation/asmval.parquet", "Assamese", 97941),
    ("validation/urdval.parquet", "Urdu", 97941),
    ("validation/sanval.parquet", "Sanskrit", 97941),
    ("validation/nepval.parquet", "Nepali", 97941),
]

def generate_report():
    total_dataset_rows = sum(s[2] for s in SHARD_METADATA)
    total_completed_rows = 0
    total_chunks_indexed = 0
    
    print("=========================================================================================================")
    print("📊 COMPLETE MULTILINGUAL DATASET INGESTION & INDEXING AUDIT REPORT")
    print("=========================================================================================================")
    print(f"{'Language':<12} | {'Shard Name':<28} | {'Done Rows':>10} | {'Remaining':>10} | {'Total Rows':>10} | {'Progress':>8} | {'Chunks':>10}")
    print("---------------------------------------------------------------------------------------------------------")
    
    for shard_path, lang_name, total_rows in SHARD_METADATA:
        safe_name = shard_path.replace("/", "_").replace(".parquet", "")
        chk_file = f"checkpoints/{safe_name}.json"
        
        done_rows = 0
        chunks = 0
        status = "pending"
        
        if os.path.exists(chk_file):
            try:
                d = json.load(open(chk_file, "r", encoding="utf-8"))
                done_rows = d.get("last_row", 0)
                chunks = d.get("total_chunks", 0)
                status = d.get("status", "pending")
                # If marked completed but rows was sampled in past tests, cap to done_rows
            except Exception:
                pass
                
        rem_rows = max(0, total_rows - done_rows)
        pct = (done_rows / total_rows) * 100.0 if total_rows > 0 else 0.0
        
        total_completed_rows += done_rows
        total_chunks_indexed += chunks
        
        print(f"{lang_name:<12} | {shard_path:<28} | {done_rows:>10,} | {rem_rows:>10,} | {total_rows:>10,} | {pct:>7.2f}% | {chunks:>10,}")

    total_remaining_rows = total_dataset_rows - total_completed_rows
    overall_percentage = (total_completed_rows / total_dataset_rows) * 100.0
    
    print("=========================================================================================================")
    print(f"{'OVERALL TOTAL':<43} | {total_completed_rows:>10,} | {total_remaining_rows:>10,} | {total_dataset_rows:>10,} | {overall_percentage:>7.2f}% | {total_chunks_indexed:>10,}")
    print("=========================================================================================================")

if __name__ == "__main__":
    generate_report()
