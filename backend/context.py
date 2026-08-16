"""
Context Selection Module.
Filters and formats the highest-confidence reranked evidence chunks,
removes redundancy, enforces strict token budgets, and formats citations.
"""

import time
from typing import List, Dict, Any, Tuple, Optional
from backend.config import settings


class ContextSelector:
    def __init__(
        self,
        max_chunks: int = settings.MAX_CONTEXT_CHUNKS,
        max_tokens: int = settings.MAX_CONTEXT_TOKENS,
        min_confidence_score: float = settings.MIN_RERANK_SCORE
    ):
        self.max_chunks = max_chunks
        self.max_tokens = max_tokens
        self.min_confidence_score = min_confidence_score

    def select_context(
        self,
        ranked_chunks: List[Dict[str, Any]],
        max_chunks: Optional[int] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Selects top non-redundant evidence chunks within token budget.
        Returns:
          - selected_chunks: List of structured chunk objects with citations
          - context_text: Formatted context prompt string
          - total_words: Word count of selected context
          - is_empty: Boolean indicating if no valid context met criteria
        """
        start_time = time.perf_counter()
        limit_chunks = max_chunks or self.max_chunks
        limit_tokens = max_tokens or self.max_tokens

        selected = []
        seen_texts = set()
        seen_doc_ids = set()
        total_words = 0
        # Approx 1 word = 1.3 tokens
        max_word_budget = int(limit_tokens / 1.3)

        for chunk in ranked_chunks:
            text = (chunk.get("text", "") or "").strip()
            score = chunk.get("score", 0.0) or chunk.get("rerank_score", 0.0)
            doc_id = chunk.get("document_id", "")

            if not text:
                continue

            # Substring / near-duplicate deduplication
            text_prefix = text[:80].lower()
            if text_prefix in seen_texts:
                continue

            words = text.split()
            word_count = len(words)

            if total_words + word_count > max_word_budget and selected:
                break

            seen_texts.add(text_prefix)
            seen_doc_ids.add(doc_id)
            total_words += word_count

            citation_id = f"[{len(selected) + 1}]"
            chunk_copy = dict(chunk)
            chunk_copy["citation_id"] = citation_id
            chunk_copy["selected_rank"] = len(selected) + 1
            selected.append(chunk_copy)

            if len(selected) >= limit_chunks:
                break

        # Format context prompt block
        formatted_blocks = []
        for c in selected:
            cid = c.get("citation_id", "[?]")
            did = c.get("document_id", "doc")
            lang = c.get("language", "hi")
            txt = c.get("text", "")
            formatted_blocks.append(f"Source {cid} (Doc: {did}, Lang: {lang}):\n{txt}")

        context_text = "\n\n".join(formatted_blocks)
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return {
            "selected_chunks": selected,
            "context_text": context_text,
            "selected_count": len(selected),
            "total_words": total_words,
            "is_empty": len(selected) == 0,
            "latency_ms": round(elapsed_ms, 2)
        }


# Global singleton
context_selector = ContextSelector()
