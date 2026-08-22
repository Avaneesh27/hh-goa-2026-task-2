from __future__ import annotations

import json
from argparse import ArgumentParser
from pathlib import Path

from datasets import get_dataset_config_names, load_dataset
import pyarrow.parquet as pq

from app.ingest import DEFAULT_DATASET, extract_passages


def parse_args():
    parser = ArgumentParser()
    parser.add_argument("--parquet", type=Path)
    parser.add_argument("--config", default="ur")
    parser.add_argument("--schema-only", action="store_true")
    parser.add_argument("--bounded-batch", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.parquet:
        parquet = pq.ParquetFile(args.parquet)
        if args.schema_only:
            print(json.dumps({
                "source": str(args.parquet),
                "row_groups": parquet.num_row_groups,
                "rows": parquet.metadata.num_rows,
                "schema": str(parquet.schema_arrow),
            }, ensure_ascii=False, indent=2))
            return
        if args.bounded_batch:
            batch = next(parquet.iter_batches(
                batch_size=1,
                columns=["target_lang", "query_id", "passages"],
                use_threads=False,
            ))
            row = batch.to_pylist()[0]
        else:
            table = parquet.read_row_group(0).slice(0, 1)
            row = table.to_pylist()[0]
        records = extract_passages(dict(row), args.config, 0)
        print(json.dumps({
            "source": str(args.parquet), "top_level_keys": sorted(row.keys()), "target_lang": row.get("target_lang"),
            "passage_count": len(records), "first_passage_length": len(records[0].text) if records else 0,
            "selected_count": sum(record.selected for record in records),
            "canonical_language": records[0].language if records else None,
        }, ensure_ascii=False, indent=2))
        return
    configs = get_dataset_config_names(DEFAULT_DATASET)
    report: dict[str, object] = {"dataset": DEFAULT_DATASET, "configs": configs, "samples": []}
    for config in configs:
        dataset = load_dataset(DEFAULT_DATASET, config, split="train", streaming=True)
        row = next(iter(dataset.take(1)))
        records = extract_passages(dict(row), config, 0)
        report["samples"].append(
            {
                "config": config,
                "top_level_keys": sorted(row.keys()),
                "passage_count": len(records),
                "first_passage_length": len(records[0].text) if records else 0,
                "selected_count": sum(record.selected for record in records),
            }
        )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
