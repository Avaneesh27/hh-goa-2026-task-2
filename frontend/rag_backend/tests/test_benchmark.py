from app.benchmark import BenchmarkRow, has_selected_evidence
from app.schemas import Citation


def test_benchmark_evidence_hit_requires_a_direct_retrieved_passage_match() -> None:
    row = BenchmarkRow(query="What is a corporation?", language="en", selected_passages=["A corporation is a legal entity."])
    citations = [
        Citation(point_id=1, language="en", passage="A corporation is a legal entity.", fused_score=0.03),
        Citation(point_id=2, language="en", passage="Other passage.", fused_score=0.01),
    ]

    assert has_selected_evidence(citations, row.selected_passages) is True
    assert has_selected_evidence(citations[1:], row.selected_passages) is False
