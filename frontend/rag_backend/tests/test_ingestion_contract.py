from pathlib import Path

from qdrant_client import QdrantClient

from app.config import Settings
from app.index_contract import ensure_collection, verify_collection_contract
import pytest

from app.ingest import DiskBudgetExceeded, canonical_language, ensure_free_space, extract_passages, official_shards, stable_point_id


def test_msmarco_style_row_extracts_all_passages_with_stable_ids() -> None:
    row = {
        "query_id": "42",
        "source_lang": "en",
        "target_lang": "hi",
        "passages": {
            "is_selected": [1, 0],
            "English_passages": ["A corporation is a legal entity.", "Second context."],
            "Translated_passages": ["  एक निगम एक कानूनी इकाई है। ", "दूसरा संदर्भ।"],
        },
    }

    passages = extract_passages(row, "hi", 15)

    assert len(passages) == 2
    assert passages[0].selected is True
    assert passages[0].source_query_id == "42"
    assert passages[0].language == "hi"
    assert passages[0].text == "एक निगम एक कानूनी इकाई है।"
    assert passages[0].point_id == stable_point_id("hi", "एक निगम एक कानूनी इकाई है।")
    assert passages[0].point_id != passages[1].point_id


def test_ingestion_collection_contract_matches_runtime_named_vector(tmp_path: Path) -> None:
    settings = Settings(qdrant_collection="contract_test", embedding_dimensions=3)
    client = QdrantClient(path=str(tmp_path / "qdrant"))

    ensure_collection(client, settings)
    verify_collection_contract(client, settings)

    collection = client.get_collection("contract_test")
    assert "dense" in collection.config.params.vectors


def test_official_parquet_plan_covers_all_fourteen_requested_language_shards() -> None:
    shards = official_shards("train")

    assert len(shards) == 14
    assert shards[0][0] == "train/asmtrain.parquet"
    assert shards[-1][0] == "train/urdtrain.parquet"
    assert all(url.endswith(name) for name, url in shards)


def test_dataset_language_script_identifiers_are_normalized_for_retrieval_and_stt() -> None:
    assert canonical_language("urd_Arab", "urd") == "ur"
    assert canonical_language("hin_Deva", "hin") == "hi"
    assert canonical_language("tam_Taml", "tam") == "ta"


def test_disk_guard_stops_before_the_reserved_free_space_is_consumed(tmp_path: Path) -> None:
    with pytest.raises(DiskBudgetExceeded):
        ensure_free_space(tmp_path / "data.sqlite3", min_free_gb=10**9)
