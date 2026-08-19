"""
Adaptive Multi-Strategy Chunking Module for Multilingual Indic RAG.
Implements:
  - Strategy 1: Atomic Passage Strategy (Default for MS MARCO: preserves complete passage integrity)
  - Strategy 2: Sentence-Aware Chunking (Devanagari danda '।' and Latin sentence boundaries for long texts >180 words)
  - Strategy 3: Structural Paragraph Chunking
"""

import re
from typing import List, Dict, Any, Optional


class AdaptiveChunker:
    def __init__(
        self,
        default_chunk_size: int = 150,  # in words
        default_overlap: int = 25,      # in words
        min_chunk_size: int = 15,       # in words
        max_atomic_passage_words: int = 180  # Up to 180 words indexed as complete unit
    ):
        self.default_chunk_size = default_chunk_size
        self.default_overlap = default_overlap
        self.min_chunk_size = min_chunk_size
        self.max_atomic_passage_words = max_atomic_passage_words

        # Sentence split regex matching Devanagari danda (।), double danda (॥), Arabic question mark (؟), Latin (. ? ! \n)
        self.sentence_pattern = re.compile(r"(?<=[।॥.?!؟])\s+|\n\s*")

    def split_sentences(self, text: str) -> List[str]:
        """Splits text into sentences respecting Indic and Latin punctuation."""
        if not text:
            return []
        raw_splits = self.sentence_pattern.split(text)
        sentences = [s.strip() for s in raw_splits if s and len(s.strip()) > 3]
        return sentences if sentences else [text.strip()]

    # =========================================================================
    # Strategy 1 — Atomic Passage Chunking (Preferred for MS MARCO)
    # =========================================================================
    def chunk_atomic_passage(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Indexes standard MS MARCO passages as unified, self-contained units.
        If a passage exceeds max_atomic_passage_words, delegates to sentence_aware.
        """
        text = doc.get("text", "")
        doc_id = doc.get("document_id", "doc_unknown")
        word_count = doc.get("word_length", len(text.split()))

        if word_count > self.max_atomic_passage_words:
            return self.chunk_sentence_aware(doc, max_words=self.default_chunk_size)

        return [{
            "document_id": doc_id,
            "chunk_id": f"{doc_id}_atomic_0",
            "parent_id": doc_id,
            "level": "passage",
            "chunking_strategy": "atomic_passage",
            "position": 0,
            "language": doc.get("language", "hi"),
            "text": text,
            "english_text": doc.get("english_text", ""),
            "word_count": word_count,
            "metadata": {
                "query_id": doc.get("query_id"),
                "passage_index": doc.get("passage_index"),
                "query_type": doc.get("query_type"),
                "is_ground_truth": doc.get("is_ground_truth", False),
                "associated_query": doc.get("associated_query", ""),
                "associated_eng_query": doc.get("associated_eng_query", ""),
                "source": doc.get("source", "msmarco-xi")
            }
        }]

    # =========================================================================
    # Strategy 2 — Sentence-Aware Chunking (For long documents)
    # =========================================================================
    def chunk_sentence_aware(
        self,
        doc: Dict[str, Any],
        max_words: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Groups full sentences up to max_words without breaking across sentence boundaries.
        """
        max_words = max_words or self.default_chunk_size
        text = doc.get("text", "")
        doc_id = doc.get("document_id", "doc_unknown")
        sentences = self.split_sentences(text)

        chunks = []
        current_chunk_sents = []
        current_word_count = 0
        chunk_pos = 0

        for sent in sentences:
            sent_word_count = len(sent.split())
            if current_word_count + sent_word_count > max_words and current_chunk_sents:
                chunk_text = " ".join(current_chunk_sents)
                chunks.append({
                    "document_id": doc_id,
                    "chunk_id": f"{doc_id}_sent_{chunk_pos}",
                    "parent_id": doc_id,
                    "level": "sentence_group",
                    "chunking_strategy": "sentence_aware",
                    "position": chunk_pos,
                    "language": doc.get("language", "hi"),
                    "text": chunk_text,
                    "english_text": doc.get("english_text", ""),
                    "word_count": len(chunk_text.split()),
                    "metadata": {
                        "query_id": doc.get("query_id"),
                        "passage_index": doc.get("passage_index"),
                        "query_type": doc.get("query_type"),
                        "is_ground_truth": doc.get("is_ground_truth", False),
                        "source": doc.get("source", "msmarco-xi")
                    }
                })
                chunk_pos += 1
                current_chunk_sents = [sent]
                current_word_count = sent_word_count
            else:
                current_chunk_sents.append(sent)
                current_word_count += sent_word_count

        if current_chunk_sents:
            chunk_text = " ".join(current_chunk_sents)
            chunks.append({
                "document_id": doc_id,
                "chunk_id": f"{doc_id}_sent_{chunk_pos}",
                "parent_id": doc_id,
                "level": "sentence_group",
                "chunking_strategy": "sentence_aware",
                "position": chunk_pos,
                "language": doc.get("language", "hi"),
                "text": chunk_text,
                "english_text": doc.get("english_text", ""),
                "word_count": len(chunk_text.split()),
                "metadata": {
                    "query_id": doc.get("query_id"),
                    "passage_index": doc.get("passage_index"),
                    "query_type": doc.get("query_type"),
                    "is_ground_truth": doc.get("is_ground_truth", False),
                    "source": doc.get("source", "msmarco-xi")
                }
            })

        return chunks

    # =========================================================================
    # Strategy 3 — Structural Paragraph Chunking
    # =========================================================================
    def chunk_structural(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Splits by structural paragraph delimiters."""
        text = doc.get("text", "")
        doc_id = doc.get("document_id", "doc_unknown")
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
        if not paragraphs:
            paragraphs = [text]

        chunks = []
        for pos, para in enumerate(paragraphs):
            chunks.append({
                "document_id": doc_id,
                "chunk_id": f"{doc_id}_struct_{pos}",
                "parent_id": doc_id,
                "level": "paragraph",
                "chunking_strategy": "structural",
                "position": pos,
                "language": doc.get("language", "hi"),
                "text": para,
                "english_text": doc.get("english_text", ""),
                "word_count": len(para.split()),
                "metadata": {
                    "query_id": doc.get("query_id"),
                    "passage_index": doc.get("passage_index"),
                    "query_type": doc.get("query_type"),
                    "is_ground_truth": doc.get("is_ground_truth", False),
                    "source": doc.get("source", "msmarco-xi")
                }
            })
        return chunks
