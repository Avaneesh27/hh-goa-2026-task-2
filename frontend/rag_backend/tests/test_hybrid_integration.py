from pathlib import Path

from qdrant_client import QdrantClient, models

from app.config import Settings
from app.pipeline import DeterministicRagPipeline
from app.retrieval import HybridRetriever, LexicalIndex


class FixedEmbeddingService:
    def encode(self, _values: list[str]) -> list[list[float]]:
        return [[1.0, 0.0, 0.0]]


class DeterministicReranker:
    def predict(self, pairs: list[tuple[str, str]]) -> list[float]:
        return [0.98 if "legal entity" in passage else 0.12 for _, passage in pairs]


class FailingReranker:
    def predict(self, _pairs: list[tuple[str, str]]) -> list[float]:
        raise RuntimeError("local reranker model is unavailable")


def build_seeded_retriever(tmp_path: Path) -> HybridRetriever:
    qdrant = QdrantClient(path=str(tmp_path / "qdrant"))
    qdrant.create_collection(
        collection_name="test_passages",
        vectors_config={"dense": models.VectorParams(size=3, distance=models.Distance.COSINE)},
    )
    qdrant.upsert(
        collection_name="test_passages",
        points=[
            models.PointStruct(
                id=101, vector={"dense": [1.0, 0.0, 0.0]},
                payload={"language": "en", "text": "A corporation is a legal entity separate from its owners.", "source_query_id": "q101"},
            ),
            models.PointStruct(
                id=102, vector={"dense": [0.0, 1.0, 0.0]},
                payload={"language": "en", "text": "Village councils manage local public services.", "source_query_id": "q102"},
            ),
        ],
        wait=True,
    )
    lexical = LexicalIndex(tmp_path / "lexical.sqlite3")
    lexical.add_many([
        (101, "en", "A corporation is a legal entity separate from its owners.", "q101"),
        (102, "en", "Village councils manage local public services.", "q102"),
    ])
    settings = Settings(
        qdrant_collection="test_passages", dense_top_k=5, lexical_top_k=5,
        rerank_top_k=5, answer_top_k=2, min_fused_score=0.001, min_extractive_score=0.05,
    )
    retriever = HybridRetriever(settings, FixedEmbeddingService(), lexical)
    retriever._qdrant = qdrant
    retriever._reranker = DeterministicReranker()
    return retriever


def test_seeded_hybrid_index_returns_evidence_backed_answer_and_citations(tmp_path: Path) -> None:
    retriever = build_seeded_retriever(tmp_path)
    pipeline = DeterministicRagPipeline(retriever._settings, retriever)

    response = pipeline.answer("What is a corporation?")

    assert response.status == "answered"
    assert response.answer is not None and "legal entity" in response.answer
    assert response.citations[0].point_id == 101
    assert response.timing_ms["dense_retrieval"] >= 0
    assert response.timing_ms["lexical_retrieval"] >= 0
    assert response.timing_ms["reranking"] >= 0


def test_pipeline_returns_structured_unavailable_response_when_indexes_fail(tmp_path: Path) -> None:
    lexical = LexicalIndex(tmp_path / "empty.sqlite3")
    settings = Settings(qdrant_url="http://127.0.0.1:9", qdrant_collection="missing")
    retriever = HybridRetriever(settings, FixedEmbeddingService(), lexical)
    pipeline = DeterministicRagPipeline(settings, retriever)

    response = pipeline.answer("What is a corporation?")

    assert response.status == "unavailable"
    assert response.answer is None
    assert "retrieval service is not ready" in (response.reason or "").lower()


def test_seeded_hybrid_path_abstains_when_evidence_cannot_meet_extractive_threshold(tmp_path: Path) -> None:
    retriever = build_seeded_retriever(tmp_path)
    strict_settings = Settings(
        qdrant_collection="test_passages", dense_top_k=5, lexical_top_k=5,
        rerank_top_k=5, answer_top_k=2, min_fused_score=0.001, min_extractive_score=1.1,
    )
    retriever._settings = strict_settings
    pipeline = DeterministicRagPipeline(strict_settings, retriever)

    response = pipeline.answer("What is a corporation?")

    assert response.status == "abstained"
    assert response.answer is None
    assert "extractive answer" in (response.reason or "").lower()
    assert response.timing_ms["dense_retrieval"] >= 0
    assert response.timing_ms["lexical_retrieval"] >= 0
    assert response.timing_ms["reranking"] >= 0


def test_seeded_hybrid_path_falls_back_when_reranker_model_fails(tmp_path: Path) -> None:
    retriever = build_seeded_retriever(tmp_path)
    retriever._reranker = FailingReranker()
    pipeline = DeterministicRagPipeline(retriever._settings, retriever)

    response = pipeline.answer("What is a corporation?")

    assert response.status == "answered"
    assert response.citations[0].point_id == 101
    assert response.citations[0].rerank_score is not None
