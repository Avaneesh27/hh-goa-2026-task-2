from app.config import Settings
from app.extractive import Candidate
from app.pipeline import DeterministicRagPipeline


class StubRetriever:
    def __init__(self, candidates: list[Candidate]) -> None:
        self._candidates = candidates

    def search(self, _query: str):
        return self._candidates, {"dense_retrieval": 1.0, "lexical_retrieval": 1.0, "reranking": 1.0}


def test_pipeline_returns_only_evidence_backed_extract() -> None:
    candidate = Candidate(
        point_id=42,
        language="en",
        text="A corporation is a legal entity that is separate from the people who own it.",
        source_query_id="1185869",
        fused_score=0.08,
        rerank_score=0.95,
    )
    pipeline = DeterministicRagPipeline(
        Settings(min_fused_score=0.01, min_extractive_score=0.10), StubRetriever([candidate])
    )

    response = pipeline.answer("What is a corporation?")

    assert response.status == "answered"
    assert response.answer in candidate.text
    assert response.citations[0].point_id == 42
    assert response.citations[0].passage == candidate.text


def test_pipeline_abstains_when_retrieval_score_is_too_low() -> None:
    candidate = Candidate(
        point_id=9,
        language="en",
        text="A village council manages local services.",
        source_query_id="9",
        fused_score=0.001,
        rerank_score=0.02,
    )
    pipeline = DeterministicRagPipeline(Settings(min_fused_score=0.01), StubRetriever([candidate]))

    response = pipeline.answer("What is a corporation?")

    assert response.status == "abstained"
    assert response.answer is None
    assert response.citations == []
