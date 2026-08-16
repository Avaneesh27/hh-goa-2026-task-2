import os
import sys

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ingestion.indexer import IngestionPipeline

if __name__ == "__main__":
    max_records = 1500
    if len(sys.argv) > 1:
        max_records = int(sys.argv[1])

    print(f"[*] Launching full offline ingestion for up to {max_records} MSMARCO-XI records...")
    pipeline = IngestionPipeline(data_file="validation/hinval.parquet", target_lang="hi")
    pipeline.run(max_records=max_records, batch_size=128, resume=False)
