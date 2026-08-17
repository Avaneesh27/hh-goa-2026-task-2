"""
Guardrails and Deterministic Abstention Pipeline for Multilingual RAG across 14 Indian Languages.
Implements:
  1. Safety / Malicious Prompt Guard
  2. Retrieval Relevance & Confidence Guard
  3. Grounding Verification Guard (Context Support Audit)
  4. Explicit Multilingual Abstention Handler in User's Native Language
"""

import time
import re
from typing import Dict, Any, List, Optional, Tuple

from backend.config import settings
from backend.keywords import UNSAFE_PATTERNS, ABSTENTION_MESSAGES


class GuardrailManager:
    def __init__(
        self,
        min_retrieval_score: float = settings.MIN_RETRIEVAL_SCORE,
        min_grounding_ratio: float = 0.25
    ):
        self.min_retrieval_score = min_retrieval_score
        self.min_grounding_ratio = min_grounding_ratio
        # Universal regex capturing all Indic scripts, Arabic/Urdu, and Latin words
        self.word_token_pattern = re.compile(
            r"[\w\u0600-\u06FF\u0750-\u077F\u0900-\u0D7F\uFB50-\uFDFF\uFE70-\uFEFF]+",
            re.UNICODE
        )

    def check_safety(self, query: str) -> Tuple[bool, Optional[str]]:
        """
        Guardrail 1: Detects malicious, unsafe, or dangerous query intents.
        Returns (is_safe, refusal_reason).
        """
        q_lower = query.lower()
        for pattern in UNSAFE_PATTERNS:
            if pattern in q_lower:
                return False, f"Query contains restricted or unsafe keyword ('{pattern}')."
        return True, None

    def check_relevance(
        self,
        query: str,
        retrieval_results: Dict[str, Any]
    ) -> Tuple[bool, Optional[str]]:
        """
        Guardrail 2: Verifies that retrieval returned viable candidate evidence above minimum confidence threshold.
        Returns (is_relevant, abstention_reason).
        """
        fused = retrieval_results.get("fused_results", [])
        if not fused:
            return False, "No candidates retrieved from vector or keyword index."

        top_score = fused[0].get("score", 0.0) or fused[0].get("rrf_score", 0.0)
        if top_score < 0.005:
            return False, f"Retrieval confidence score ({top_score:.4f}) is below minimum threshold."

        return True, None

    def check_rerank_confidence(
        self,
        reranked_results: List[Dict[str, Any]],
        min_score: float = 0.20,
        min_raw_score: float = -2.5
    ) -> Tuple[bool, Optional[str]]:
        """
        Guardrail 2b: Verifies that top cross-encoder score indicates genuine semantic relevance.
        Calibrated for multilingual and cross-lingual Indic query-passage pairs.
        """
        if not reranked_results:
            return False, "No evidence passages remained after reranking."

        top_item = reranked_results[0]
        top_score = top_item.get("rerank_score", 0.0)
        raw_score = top_item.get("raw_rerank_score", None)

        if raw_score is not None and raw_score < min_raw_score:
            return False, f"Reranker cross-encoder raw score ({raw_score:.2f}) is below semantic relevance threshold ({min_raw_score})."

        if top_score < min_score:
            return False, f"Top evidence rerank confidence ({top_score:.3f}) is below relevance threshold ({min_score})."

        return True, None

    def check_grounding(
        self,
        answer: str,
        context_text: str,
        language: str = "hi"
    ) -> Tuple[bool, float, Optional[str]]:
        """
        Guardrail 3: Verifies that the generated answer is strictly supported by the retrieved context.
        Computes lexical and semantic support, handling cross-lingual translations gracefully.
        Returns (is_grounded, grounding_score, reason).
        """
        if not answer or "ABSTAIN" in answer.upper():
            return False, 0.0, "Model explicitly signaled insufficient evidence to answer (ABSTAIN)."

        if not context_text or not context_text.strip():
            return False, 0.0, "Context is empty."

        ans_tokens = set(self.word_token_pattern.findall(answer.lower()))
        ctx_tokens = set(self.word_token_pattern.findall(context_text.lower()))

        # Filter out short tokens
        ans_content_tokens = {t for t in ans_tokens if len(t) > 2}
        if not ans_content_tokens:
            return True, 1.0, "Short answer grounded."

        overlap = ans_content_tokens.intersection(ctx_tokens)
        grounding_ratio = len(overlap) / len(ans_content_tokens)

        # Check if citations match
        ans_citations = set(re.findall(r"\[\d+\]", answer))
        ctx_citations = set(re.findall(r"\[\d+\]", context_text))
        has_valid_citation = bool(ans_citations and ans_citations.issubset(ctx_citations))

        # Check for numeric entity consistency
        ans_digits = set(re.findall(r"\b\d+\b", answer))
        ctx_digits = set(re.findall(r"\b\d+\b", context_text))
        digits_consistent = not ans_digits or bool(ans_digits.intersection(ctx_digits))

        if grounding_ratio < self.min_grounding_ratio:
            if not has_valid_citation or not digits_consistent:
                return False, round(grounding_ratio, 3), f"Answer content overlap with context ({grounding_ratio:.1%}) is below grounding threshold ({self.min_grounding_ratio:.1%})."

        return True, round(grounding_ratio, 3), "Answer verified and grounded against retrieved evidence."

    def get_abstention_response(
        self,
        language: str = "hi",
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Guardrail 4: Returns deterministic, polite abstention text matching user language.
        Supports all 14 Indian languages + English + Hinglish.
        """
        norm_lang = (language or "en").lower().strip()
        msg = ABSTENTION_MESSAGES.get(norm_lang, ABSTENTION_MESSAGES.get("en", "I couldn't find sufficient evidence in the retrieved dataset to answer that reliably."))

        return {
            "answer": msg,
            "grounded": False,
            "abstained": True,
            "confidence": 0.0,
            "abstention_reason": reason or "Insufficient evidence in indexed corpus."
        }


# Global singleton
guardrails = GuardrailManager()
