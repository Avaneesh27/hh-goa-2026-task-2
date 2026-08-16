import os
import sys
import pytest

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ingestion.chunker import AdaptiveChunker, select_adaptive_chunk_strategy


def test_sentence_aware_chunking():
    chunker = AdaptiveChunker(default_chunk_size=10, min_chunk_size=2)
    doc = {
        "document_id": "doc_test_1",
        "query_id": 1,
        "passage_index": 0,
        "language": "hi",
        "text": "प्रथम वाक्य यहाँ समाप्त होता है। दूसरा वाक्य यहाँ से शुरू होता है। तीसरा वाक्य अंतिम है।"
    }
    chunks = chunker.chunk_sentence_aware(doc, max_words=8)
    assert len(chunks) >= 2
    for c in chunks:
        assert c["document_id"] == "doc_test_1"
        assert c["chunking_strategy"] == "sentence_aware"
        assert len(c["text"]) > 0


def test_multi_resolution_chunking():
    chunker = AdaptiveChunker()
    doc = {
        "document_id": "doc_hier_1",
        "query_id": 2,
        "passage_index": 0,
        "language": "hi",
        "text": "अनुच्छेद एक।\n\nअनुच्छेद दो।"
    }
    chunks = chunker.chunk_multi_resolution(doc)
    levels = {c["level"] for c in chunks}
    assert "document" in levels
    assert "paragraph" in levels
    assert "fine_grained" in levels


def test_adaptive_chunk_selector():
    strat1, reason1 = select_adaptive_chunk_strategy("कॉर्पोरेशन क्या है?", "definition")
    assert strat1 == "sentence_aware"

    strat2, reason2 = select_adaptive_chunk_strategy("Explain in detail the full architectural comparison of corporations vs partnerships", "comparison")
    assert strat2 == "multi_resolution"
