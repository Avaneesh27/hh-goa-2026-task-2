import os
import sys
import unittest

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ingestion.chunker import AdaptiveChunker


class TestAdaptiveChunker(unittest.TestCase):

    def test_sentence_aware_chunking(self):
        chunker = AdaptiveChunker(default_chunk_size=10, min_chunk_size=2)
        doc = {
            "document_id": "doc_test_1",
            "query_id": 1,
            "passage_index": 0,
            "language": "hi",
            "text": "प्रथम वाक्य यहाँ समाप्त होता है। दूसरा वाक्य यहाँ से शुरू होता है। तीसरा वाक्य अंतिम है।"
        }
        chunks = chunker.chunk_sentence_aware(doc, max_words=8)
        self.assertGreaterEqual(len(chunks), 2)
        for c in chunks:
            self.assertEqual(c["document_id"], "doc_test_1")
            self.assertEqual(c["chunking_strategy"], "sentence_aware")
            self.assertGreater(len(c["text"]), 0)

    def test_atomic_passage_chunking(self):
        chunker = AdaptiveChunker()
        doc = {
            "document_id": "doc_atomic_1",
            "query_id": 2,
            "passage_index": 0,
            "language": "hi",
            "text": "यह एक छोटा सा अनुच्छेद है जो अक्षुण्ण रहना चाहिए।"
        }
        chunks = chunker.chunk_atomic_passage(doc)
        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0]["chunking_strategy"], "atomic_passage")
        self.assertEqual(chunks[0]["text"], doc["text"])

    def test_structural_chunking(self):
        chunker = AdaptiveChunker()
        doc = {
            "document_id": "doc_struct_1",
            "query_id": 3,
            "passage_index": 0,
            "language": "hi",
            "text": "पहला पैराग्राफ यहाँ है।\n\nदूसरा पैराग्राफ यहाँ है।"
        }
        chunks = chunker.chunk_structural(doc)
        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0]["chunking_strategy"], "structural")
        self.assertEqual(chunks[1]["chunking_strategy"], "structural")


if __name__ == "__main__":
    unittest.main()
