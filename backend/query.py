"""
Deterministic Query Processing Module for 14 Indian Languages, English, and Hinglish.
Implements:
  1. Unicode NFKC & whitespace normalization
  2. Deterministic multilingual language detection (14 Indic scripts + Hinglish/Latin)
  3. Deterministic intent classification via multilingual keyword patterns
  4. Salient keyword & entity extraction for BM25 boosting across all Indic languages
  5. Retrieval query compilation (preserving original query)
"""

import re
import time
import unicodedata
from typing import List, Dict, Any, Tuple, Optional, Set

from backend.keywords import (
    INTENT_KEYWORDS,
    HINGLISH_KEYWORDS,
    MARATHI_MARKERS,
    NEPALI_MARKERS,
    SANSKRIT_MARKERS,
    ASSAMESE_MARKERS,
    MULTILINGUAL_STOPWORDS,
    HINDI_STOPWORDS,
    ENGLISH_STOPWORDS,
    UNSAFE_PATTERNS
)
from backend.schemas import QueryProcessingOutput


class QueryProcessor:
    def __init__(self):
        self.script_patterns = {
            "Devanagari": (re.compile(r"[\u0900-\u097F]"), "hi"),
            "Bengali": (re.compile(r"[\u0980-\u09FF]"), "bn"),
            "Gurmukhi": (re.compile(r"[\u0A00-\u0A7F]"), "pa"),
            "Gujarati": (re.compile(r"[\u0A80-\u0AFF]"), "gu"),
            "Odia": (re.compile(r"[\u0B00-\u0B7F]"), "or"),
            "Tamil": (re.compile(r"[\u0B80-\u0BFF]"), "ta"),
            "Telugu": (re.compile(r"[\u0C00-\u0C7F]"), "te"),
            "Kannada": (re.compile(r"[\u0C80-\u0CFF]"), "kn"),
            "Malayalam": (re.compile(r"[\u0D00-\u0D7F]"), "ml"),
            "Arabic": (re.compile(r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]"), "ur"),
            "Latin": (re.compile(r"[a-zA-Z]"), "en")
        }
        self.token_pattern = re.compile(r"[\w\u0600-\u06FF\u0750-\u077F\u0900-\u0D7F\uFB50-\uFDFF\uFE70-\uFEFF]+", re.UNICODE)
        self.extra_spaces_pattern = re.compile(r"\s+")

    def normalize_query(self, query: str) -> str:
        """Cleans and normalizes query Unicode, whitespaces, and punctuation."""
        if not query:
            return ""
        # NFKC Unicode normalization
        normalized = unicodedata.normalize("NFKC", query)
        # Normalize punctuation (strip leading bullets/dots/quotes)
        normalized = re.sub(r"^[\s\.\,\:\;\-\–\—\?\"\']+", "", normalized)
        # Collapse multiple spaces
        normalized = self.extra_spaces_pattern.sub(" ", normalized).strip()
        return normalized

    def detect_language(self, query: str) -> str:
        """
        Deterministically detects language across 14 Indic scripts + English/Hinglish:
          - Devanagari -> Hindi ("hi") / Marathi ("mr") / Nepali ("ne") / Sanskrit ("sa")
          - Bengali -> Bengali ("bn") / Assamese ("as")
          - Gurmukhi -> Punjabi ("pa")
          - Gujarati -> Gujarati ("gu")
          - Odia -> Odia ("or")
          - Tamil -> Tamil ("ta")
          - Telugu -> Telugu ("te")
          - Kannada -> Kannada ("kn")
          - Malayalam -> Malayalam ("ml")
          - Arabic -> Urdu ("ur")
          - Latin -> English ("en") / Hinglish ("hinglish")
        """
        if not query:
            return "unknown"

        script_counts = {}
        for script_name, (pat, default_code) in self.script_patterns.items():
            matches = len(pat.findall(query))
            if matches > 0:
                script_counts[script_name] = (matches, default_code)

        if not script_counts:
            return "unknown"

        top_script, (count, code) = max(script_counts.items(), key=lambda x: x[1][0])

        words = set(query.lower().split())

        if top_script == "Devanagari":
            # Check for Marathi specific vocabulary markers
            if any(w in MARATHI_MARKERS for w in words):
                return "mr"
            # Check for Nepali markers
            if any(w in NEPALI_MARKERS for w in words):
                return "ne"
            # Check for Sanskrit markers
            if any(w in SANSKRIT_MARKERS for w in words):
                return "sa"
            return "hi"

        if top_script == "Bengali":
            # Check for Assamese markers
            if any(w in ASSAMESE_MARKERS for w in words):
                return "as"
            return "bn"

        if top_script == "Latin":
            hinglish_match_count = sum(1 for w in words if w in HINGLISH_KEYWORDS)
            if hinglish_match_count >= 1:
                return "hinglish"
            return "en"

        return code

    def classify_intent(self, query: str) -> str:
        """
        Deterministically matches keywords in query to classify intent.
        Returns one of: "definition", "numeric", "comparison", "procedural", "factual", "ambiguous"
        """
        q_lower = query.lower()

        # Priority 1: Definition
        for kw in INTENT_KEYWORDS["definition"]:
            if kw in q_lower:
                return "definition"

        # Priority 2: Numeric
        for kw in INTENT_KEYWORDS["numeric"]:
            if kw in q_lower:
                return "numeric"

        # Priority 3: Comparison
        for kw in INTENT_KEYWORDS["comparison"]:
            if kw in q_lower:
                return "comparison"

        # Priority 4: Procedural
        for kw in INTENT_KEYWORDS["procedural"]:
            if kw in q_lower:
                return "procedural"

        # Priority 5: General Factual
        for kw in INTENT_KEYWORDS["factual"]:
            if kw in q_lower:
                return "factual"

        return "factual" if len(query.split()) > 2 else "ambiguous"

    def extract_keywords(self, query: str, language: str) -> List[str]:
        """
        Extracts salient non-stopword tokens and entities for BM25 keyword boosting.
        """
        tokens = self.token_pattern.findall(query)
        stopwords = MULTILINGUAL_STOPWORDS.get(language, MULTILINGUAL_STOPWORDS.get("hi" if language == "hinglish" else "en", ENGLISH_STOPWORDS))
        
        extracted = []
        for t in tokens:
            t_clean = t.lower()
            if len(t_clean) > 1 and t_clean not in stopwords and not t_clean.isnumeric():
                extracted.append(t)
            elif t.isnumeric():
                # Keep numeric entities (years, quantities)
                extracted.append(t)

        return extracted

    def build_retrieval_query(self, normalized_query: str, keywords: List[str]) -> str:
        """
        Constructs the optimized retrieval query string without mutating original query.
        """
        return normalized_query

    def process(
        self,
        raw_query: str,
        language: Optional[str] = None,
        filter_language: Optional[str] = None
    ) -> QueryProcessingOutput:
        """
        Executes full deterministic query processing pipeline.
        """
        start_time = time.perf_counter()

        normalized = self.normalize_query(raw_query)
        detected_lang = self.detect_language(normalized)
        effective_lang = language.lower().strip() if language and language.strip() else detected_lang
        intent = self.classify_intent(normalized)
        keywords = self.extract_keywords(normalized, effective_lang)
        retrieval_q = self.build_retrieval_query(normalized, keywords)

        filters = {}
        if filter_language:
            filters["language"] = filter_language

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return QueryProcessingOutput(
            original_query=raw_query,
            normalized_query=normalized,
            retrieval_query=retrieval_q,
            language=effective_lang,
            intent=intent,
            keywords=keywords,
            metadata_filters=filters,
            retrieval_strategy="hybrid",
            latency_ms=round(elapsed_ms, 2)
        )


# Global singleton
query_processor = QueryProcessor()


if __name__ == "__main__":
    import sys
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    qp = QueryProcessor()
    test_queries = [
        "कॉर्पोरेशन क्या है?",
        "what is a corporation?",
        "India ka capital kya hai?",
        "ताजमहल कब बना था?",
        "Compare corporation vs partnership"
    ]

    for q in test_queries:
        out = qp.process(q)
        print(f"[{out.language.upper()} | {out.intent}] Query: '{out.original_query}' -> Keywords: {out.keywords} ({out.latency_ms}ms)")
