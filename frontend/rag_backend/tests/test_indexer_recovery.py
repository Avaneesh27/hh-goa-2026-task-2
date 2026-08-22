from pathlib import Path

from qdrant_client import QdrantClient

from app.config import Settings
from app.index_contract import ensure_collection
from app.ingest import CorpusIndexer, IngestState, PassageRecord
from app.retrieval import LexicalIndex


class FixedEmbeddingService:
    def encode(self, values: list[str]) -> list[list[float]]:
        return [[1.0, 0.0, 0.0] for _ in values]


def build_local_indexer(tmp_path: Path) -> tuple[CorpusIndexer, QdrantClient, LexicalIndex, Settings]:
    settings = Settings(qdrant_collection="ingest_contract", embedding_dimensions=3)
    qdrant = QdrantClient(path=str(tmp_path / "qdrant"))
    ensure_collection(qdrant, settings)
    lexical = LexicalIndex(tmp_path / "lexical.sqlite3")
    indexer = object.__new__(CorpusIndexer)
    indexer.settings = settings
    indexer.qdrant = qdrant
    indexer.lexical = lexical
    indexer.embeddings = FixedEmbeddingService()
    return indexer, qdrant, lexical, settings


def test_index_batch_writes_runtime_dense_vector_payload_and_lexical_contract(tmp_path: Path) -> None:
    indexer, qdrant, lexical, settings = build_local_indexer(tmp_path)
    record = PassageRecord(
        point_id=501, language="ur", text="کارپوریشن ایک قانونی ادارہ ہے۔",
        source_query_id="42", source_config="default", selected=True,
    )

    indexed = indexer.index_batch([record])
    stored = qdrant.retrieve(settings.qdrant_collection, ids=[501], with_payload=True, with_vectors=True)[0]
    lexical_result = lexical.search("کارپوریشن قانونی", 1)[0]

    assert indexed == 1
    assert stored.vector["dense"] == [1.0, 0.0, 0.0]
    assert stored.payload == {
        "language": "ur", "text": "کارپوریشن ایک قانونی ادارہ ہے۔", "source_query_id": "42",
        "source_config": "default", "is_selected": True,
    }
    assert lexical_result.point_id == 501
    assert lexical_result.text == record.text


def test_checkpoint_resume_and_duplicate_replay_preserve_index_integrity(tmp_path: Path) -> None:
    indexer, qdrant, lexical, settings = build_local_indexer(tmp_path)
    state_path = tmp_path / "ingest-state.sqlite3"
    state = IngestState(state_path)
    record = PassageRecord(
        point_id=777, language="hi", text="एक निगम एक कानूनी इकाई है।",
        source_query_id="99", source_config="default", selected=True,
    )

    indexer.index_batch([record])
    state.checkpoint("default", "train", next_offset=128, processed_rows=128, indexed_passages=1, rejected_rows=0)
    state.reject("default", "train", source_offset=17, reason="malformed source row")

    restarted_state = IngestState(state_path)
    assert restarted_state.resume_offset("default", "train") == 128
    indexer.index_batch([record])

    assert qdrant.count(settings.qdrant_collection, exact=True).count == 1
    assert lexical.document_count() == 1
    summary = restarted_state.summary()[0]
    assert summary["processed_rows"] == 128
    assert summary["indexed_passages"] == 1
    assert restarted_state._connection.execute("SELECT COUNT(*) FROM rejects").fetchone()[0] == 1
