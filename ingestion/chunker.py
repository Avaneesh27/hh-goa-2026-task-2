"""
Adaptive Multi-Strategy Chunking Module for Multilingual RAG (Hindi + English).
Implements:
  - Strategy A: Structural Chunking (Paragraph / Section / Header aware)
  - Strategy B: Sentence-Aware Chunking (Devanagari danda '।' and Latin sentence boundaries)
  - Strategy C: Sliding Window Chunking (Configurable size and overlap)
  - Strategy D: Semantic Chunking (Sentence embedding similarity boundary detection)
  - Strategy E: Multi-Resolution Hierarchical Indexing (Document -> Paragraph -> Sentence chunk)
  - Adaptive Strategy Selector: Query-adaptive selection based on intent and length.
"""

import re
import math
from typing import List, Dict, Any, Optional, Tuple


class AdaptiveChunker:
    def __init__(
        self,
        default_chunk_size: int = 150,  # in words (~300-350 tokens)
        default_overlap: int = 25,      # in words (~50 tokens)
        min_chunk_size: int = 20,       # in words
        semantic_similarity_threshold: float = 0.75
    ):
        self.default_chunk_size = default_chunk_size
        self.default_overlap = default_overlap
        self.min_chunk_size = min_chunk_size
        self.semantic_similarity_threshold = semantic_similarity_threshold

        # Sentence split regex matching Devanagari danda (।), double danda (॥), Latin (. ? ! \n)
        self.sentence_pattern = re.compile(r"(?<=[।॥.?!])\s+|\n\s*")

    def split_sentences(self, text: str) -> List[str]:
        """Splits text into sentences respecting Devanagari and Latin punctuation."""
        if not text:
            return []
        raw_splits = self.sentence_pattern.split(text)
        sentences = [s.strip() for s in raw_splits if s and len(s.strip()) > 3]
        return sentences if sentences else [text.strip()]

    # =========================================================================
    # Strategy A — Structural Chunking
    # =========================================================================
    def chunk_structural(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Splits by structural delimiters (paragraphs, newlines, double breaks).
        """
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
                "word_count": len(para.split()),
                "metadata": {
                    "query_id": doc.get("query_id"),
                    "passage_index": doc.get("passage_index"),
                    "source": doc.get("source", "msmarco-xi")
                }
            })
        return chunks

    # =========================================================================
    # Strategy B — Sentence-Aware Chunking
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
                    "word_count": len(chunk_text.split()),
                    "metadata": {
                        "query_id": doc.get("query_id"),
                        "passage_index": doc.get("passage_index"),
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
                "word_count": len(chunk_text.split()),
                "metadata": {
                    "query_id": doc.get("query_id"),
                    "passage_index": doc.get("passage_index"),
                    "source": doc.get("source", "msmarco-xi")
                }
            })

        return chunks

    # =========================================================================
    # Strategy C — Sliding Window Chunking
    # =========================================================================
    def chunk_sliding_window(
        self,
        doc: Dict[str, Any],
        window_size: Optional[int] = None,
        overlap: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Fixed-size sliding window with configurable token/word overlap.
        """
        window_size = window_size or self.default_chunk_size
        overlap = overlap or self.default_overlap
        step = max(1, window_size - overlap)

        text = doc.get("text", "")
        doc_id = doc.get("document_id", "doc_unknown")
        words = text.split()

        if len(words) <= window_size:
            return [{
                "document_id": doc_id,
                "chunk_id": f"{doc_id}_sliding_0",
                "parent_id": doc_id,
                "level": "sliding_window",
                "chunking_strategy": "sliding_window",
                "position": 0,
                "language": doc.get("language", "hi"),
                "text": text,
                "word_count": len(words),
                "metadata": {
                    "query_id": doc.get("query_id"),
                    "passage_index": doc.get("passage_index"),
                    "source": doc.get("source", "msmarco-xi")
                }
            }]

        chunks = []
        chunk_pos = 0
        for i in range(0, len(words), step):
            chunk_words = words[i:i + window_size]
            if len(chunk_words) < self.min_chunk_size and chunks:
                break
            chunk_text = " ".join(chunk_words)
            chunks.append({
                "document_id": doc_id,
                "chunk_id": f"{doc_id}_sliding_{chunk_pos}",
                "parent_id": doc_id,
                "level": "sliding_window",
                "chunking_strategy": "sliding_window",
                "position": chunk_pos,
                "language": doc.get("language", "hi"),
                "text": chunk_text,
                "word_count": len(chunk_words),
                "metadata": {
                    "query_id": doc.get("query_id"),
                    "passage_index": doc.get("passage_index"),
                    "source": doc.get("source", "msmarco-xi")
                }
            })
            chunk_pos += 1
            if i + window_size >= len(words):
                break

        return chunks

    # =========================================================================
    # Strategy D — Semantic Chunking
    # =========================================================================
    def chunk_semantic(
        self,
        doc: Dict[str, Any],
        embedder=None
    ) -> List[Dict[str, Any]]:
        """
        Groups sentences by semantic coherence. If embedder is provided, computes
        sentence cosine similarities to find topic shift boundaries. Otherwise
        falls back to sentence-aware clustering.
        """
        text = doc.get("text", "")
        doc_id = doc.get("document_id", "doc_unknown")
        sentences = self.split_sentences(text)

        if len(sentences) <= 2:
            return self.chunk_sentence_aware(doc)

        if embedder is None:
            # Deterministic word-overlap semantic grouping fallback
            return self.chunk_sentence_aware(doc, max_words=80)

        # Compute sentence embeddings
        embeddings = embedder.encode(sentences, convert_to_numpy=True)
        # Compute adjacent cosine similarities
        import numpy as np
        similarities = []
        for i in range(len(embeddings) - 1):
            norm_a = np.linalg.norm(embeddings[i])
            norm_b = np.linalg.norm(embeddings[i + 1])
            if norm_a == 0 or norm_b == 0:
                sim = 1.0
            else:
                sim = float(np.dot(embeddings[i], embeddings[i + 1]) / (norm_a * norm_b))
            similarities.append(sim)

        # Split at drops below similarity threshold
        chunks = []
        curr_sents = [sentences[0]]
        chunk_pos = 0

        for i, sim in enumerate(similarities):
            if sim < self.semantic_similarity_threshold and len(" ".join(curr_sents).split()) >= self.min_chunk_size:
                chunk_text = " ".join(curr_sents)
                chunks.append({
                    "document_id": doc_id,
                    "chunk_id": f"{doc_id}_sem_{chunk_pos}",
                    "parent_id": doc_id,
                    "level": "semantic_group",
                    "chunking_strategy": "semantic",
                    "position": chunk_pos,
                    "language": doc.get("language", "hi"),
                    "text": chunk_text,
                    "word_count": len(chunk_text.split()),
                    "metadata": {
                        "query_id": doc.get("query_id"),
                        "passage_index": doc.get("passage_index"),
                        "source": doc.get("source", "msmarco-xi")
                    }
                })
                chunk_pos += 1
                curr_sents = [sentences[i + 1]]
            else:
                curr_sents.append(sentences[i + 1])

        if curr_sents:
            chunk_text = " ".join(curr_sents)
            chunks.append({
                "document_id": doc_id,
                "chunk_id": f"{doc_id}_sem_{chunk_pos}",
                "parent_id": doc_id,
                "level": "semantic_group",
                "chunking_strategy": "semantic",
                "position": chunk_pos,
                "language": doc.get("language", "hi"),
                "text": chunk_text,
                "word_count": len(chunk_text.split()),
                "metadata": {
                    "query_id": doc.get("query_id"),
                    "passage_index": doc.get("passage_index"),
                    "source": doc.get("source", "msmarco-xi")
                }
            })

        return chunks

    # =========================================================================
    # Strategy E — Multi-Resolution Indexing
    # =========================================================================
    def chunk_multi_resolution(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Produces multi-resolution hierarchical representations:
        1. Document-level (macro context)
        2. Paragraph-level (structural meso context)
        3. Sentence/Fine-grained level (micro precise evidence)
        """
        text = doc.get("text", "")
        doc_id = doc.get("document_id", "doc_unknown")
        chunks = []

        # Level 1: Document level
        chunks.append({
            "document_id": doc_id,
            "chunk_id": f"{doc_id}_l1_doc",
            "parent_id": None,
            "level": "document",
            "chunking_strategy": "multi_resolution",
            "position": 0,
            "language": doc.get("language", "hi"),
            "text": text,
            "word_count": len(text.split()),
            "metadata": {
                "query_id": doc.get("query_id"),
                "passage_index": doc.get("passage_index"),
                "source": doc.get("source", "msmarco-xi")
            }
        })

        # Level 2: Paragraph / meso level
        paragraphs = self.chunk_structural(doc)
        for p in paragraphs:
            p["chunk_id"] = f"{doc_id}_l2_{p['position']}"
            p["parent_id"] = f"{doc_id}_l1_doc"
            p["level"] = "paragraph"
            p["chunking_strategy"] = "multi_resolution"
            chunks.append(p)

        # Level 3: Fine-grained sentence level
        sentences = self.chunk_sentence_aware(doc, max_words=45)
        for s in sentences:
            s["chunk_id"] = f"{doc_id}_l3_{s['position']}"
            s["parent_id"] = f"{doc_id}_l1_doc"
            s["level"] = "fine_grained"
            s["chunking_strategy"] = "multi_resolution"
            chunks.append(s)

        return chunks

    # =========================================================================
    # Master Strategy Dispatcher
    # =========================================================================
    def chunk_document(
        self,
        doc: Dict[str, Any],
        strategy: str = "sentence_aware"
    ) -> List[Dict[str, Any]]:
        """Dispatches chunking to the designated strategy."""
        if strategy == "structural":
            return self.chunk_structural(doc)
        elif strategy == "sliding_window":
            return self.chunk_sliding_window(doc)
        elif strategy == "semantic":
            return self.chunk_semantic(doc)
        elif strategy == "multi_resolution":
            return self.chunk_multi_resolution(doc)
        else:
            # Default: sentence_aware
            return self.chunk_sentence_aware(doc)


# =========================================================================
# Adaptive Strategy Selector
# =========================================================================
def select_adaptive_chunk_strategy(query: str, intent: str = "factual") -> Tuple[str, str]:
    """
    Selects chunking strategy deterministically based on query length and intent:
      - Simple/Factual query (<= 6 words) -> sentence_aware (precise evidence)
      - Highly specific / numeric / entity query -> sentence_aware (fine-grained)
      - Complex / Long query (> 10 words) -> multi_resolution
      - Broad / Descriptive / comparison query -> structural / sliding_window
    Returns (strategy_name, reason).
    """
    words = query.strip().split()
    word_count = len(words)

    if intent in ("numeric", "entity", "person", "definition") and word_count <= 8:
        return "sentence_aware", f"Fine-grained sentence chunking chosen for {intent} query ({word_count} words)"
    elif word_count > 10 or intent in ("comparison", "procedural"):
        return "multi_resolution", f"Multi-resolution hierarchical chunking chosen for complex/long query ({word_count} words)"
    elif intent == "description":
        return "structural", f"Structural paragraph chunking chosen for descriptive query ({word_count} words)"
    else:
        return "sentence_aware", f"Default sentence-aware chunking chosen for query ({word_count} words)"


if __name__ == "__main__":
    import sys
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
    chunker = AdaptiveChunker()
    sample_doc = {
        "document_id": "doc_1102432_0_hi",
        "query_id": 1102432,
        "passage_index": 0,
        "language": "hi",
        "text": "एक कंपनी एक विशिष्ट देश में निगमित होती है। अक्सर उस देश के एक छोटे उपसमूह की सीमाओं के भीतर होती है। निगम तब उस राज्य में निगमन के कानूनों द्वारा शासित होता है।"
    }

    print("--- Strategy A: Structural ---")
    for c in chunker.chunk_structural(sample_doc):
        print(c["chunk_id"], "->", c["text"][:60])

    print("\n--- Strategy B: Sentence Aware ---")
    for c in chunker.chunk_sentence_aware(sample_doc, max_words=10):
        print(c["chunk_id"], "->", c["text"])

    print("\n--- Strategy C: Sliding Window ---")
    for c in chunker.chunk_sliding_window(sample_doc, window_size=12, overlap=4):
        print(c["chunk_id"], "->", c["text"])

    print("\n--- Strategy E: Multi Resolution ---")
    for c in chunker.chunk_multi_resolution(sample_doc):
        print(f"[{c['level']}] {c['chunk_id']} -> {c['text'][:50]}")

    strat, reason = select_adaptive_chunk_strategy("कॉर्पोरेशन क्या है?", "definition")
    print(f"\nAdaptive Strategy Selected: {strat} ({reason})")
