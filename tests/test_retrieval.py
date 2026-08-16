import os
import sys
import pytest

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.retrieval import reciprocal_rank_fusion, hybrid_retriever


def test_reciprocal_rank_fusion():
    dense_res = [
        {"chunk_id": "c1", "text": "text 1", "score": 0.95},
        {"chunk_id": "c2", "text": "text 2", "score": 0.85},
    ]
    bm25_res = [
        {"chunk_id": "c2", "text": "text 2", "score": 1.0},
        {"chunk_id": "c3", "text": "text 3", "score": 0.8},
    ]
    fused = reciprocal_rank_fusion(dense_res, bm25_res, k=60, top_k=3)
    assert len(fused) == 3
    # c2 appeared in both, so it should rank #1 in RRF
    assert fused[0]["chunk_id"] == "c2"
    assert fused[0]["rrf_score"] > fused[1]["rrf_score"]


def test_hybrid_search():
    res = hybrid_retriever.retrieve("कॉर्पोरेशन क्या है?", dense_top_k=5, bm25_top_k=5)
    assert "dense_results" in res
    assert "bm25_results" in res
    assert "fused_results" in res
    assert len(res["fused_results"]) > 0
