"""
Normalized Data Cleaning & Preprocessing Module for MSMARCO-XI Dataset.
Preserves:
  - query_id, query_type, source_lang, target_lang, is_selected (for evaluation)
  - text (clean native Indic script)
  - english_text (original English text)
  - query & answer pairs
  - deterministic document ID: doc_{query_id}_{passage_index}_{language}
"""

import re
import unicodedata
import hashlib
from typing import Dict, Any, List, Optional, Tuple


class TextCleaner:
    def __init__(self):
        # Regex patterns
        self.html_tag_pattern = re.compile(r"<[^>]+>")
        self.html_entity_pattern = re.compile(r"&(?:[a-z\d]+|#\d+|#x[a-f\d]+);", re.IGNORECASE)
        self.url_pattern = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
        self.extra_whitespace_pattern = re.compile(r"[^\S\r\n]+")
        self.multiple_newlines_pattern = re.compile(r"\n{3,}")
        self.control_chars_pattern = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")

    def clean_text(self, text: Optional[str]) -> str:
        """
        Cleans and normalizes text while preserving all Indic characters,
        danda (।), sentence terminators, and numbers.
        """
        if not text or not isinstance(text, str):
            return ""

        # 1. Unicode Normalization (NFKC to resolve combined glyphs while keeping scripts intact)
        text = unicodedata.normalize("NFKC", text)

        # 2. Strip control characters
        text = self.control_chars_pattern.sub("", text)

        # 3. Strip HTML tags (replacing with space to prevent words from sticking together)
        text = self.html_tag_pattern.sub(" ", text)

        # 4. Replace common HTML entities
        text = text.replace("&nbsp;", " ").replace("&quot;", '"').replace("&amp;", "&")
        text = text.replace("&lt;", "<").replace("&gt;", ">").replace("&#39;", "'")
        text = self.html_entity_pattern.sub(" ", text)

        # 5. Clean URLs
        text = self.url_pattern.sub("", text)

        # 6. Normalize whitespace
        text = self.extra_whitespace_pattern.sub(" ", text)
        text = self.multiple_newlines_pattern.sub("\n\n", text)
        text = text.strip()

        return text

    def clean_document(
        self,
        raw_text: str,
        query_id: int,
        passage_index: int,
        english_raw_text: Optional[str] = None,
        language: str = "hi",
        query_type: Optional[str] = None,
        is_selected: int = 0,
        query: Optional[str] = None,
        eng_query: Optional[str] = None,
        source: str = "msmarco-xi"
    ) -> Optional[Dict[str, Any]]:
        """
        Cleans a single passage and packages it into a structured, relationship-preserving document.
        Returns None if document is empty or below minimum character threshold.
        """
        cleaned_text = self.clean_text(raw_text)
        if not cleaned_text or len(cleaned_text) < 15:
            return None

        cleaned_en = self.clean_text(english_raw_text) if english_raw_text else ""
        cleaned_q = self.clean_text(query) if query else ""
        cleaned_en_q = self.clean_text(eng_query) if eng_query else ""

        # Deterministic document ID
        doc_id = f"doc_{query_id}_{passage_index}_{language}"

        return {
            "document_id": doc_id,
            "query_id": int(query_id),
            "passage_index": int(passage_index),
            "language": language,
            "source": source,
            "query_type": query_type or "UNKNOWN",
            "is_ground_truth": bool(is_selected),
            "text": cleaned_text,
            "english_text": cleaned_en,
            "associated_query": cleaned_q,
            "associated_eng_query": cleaned_en_q,
            "char_length": len(cleaned_text),
            "word_length": len(cleaned_text.split()),
            "hash": hashlib.md5(cleaned_text.encode("utf-8")).hexdigest()
        }

    def clean_batch(
        self,
        records: List[Dict[str, Any]],
        target_lang: str = "hi",
        deduplicate: bool = True
    ) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        """
        Processes a batch of dataset records, extracting both Indic and English passages
        with preserved query-to-passage and ground-truth relationships.
        """
        cleaned_docs = []
        seen_hashes = set()
        stats = {
            "input_passages": 0,
            "valid_docs": 0,
            "empty_or_short_skipped": 0,
            "duplicates_skipped": 0
        }

        for record in records:
            q_id = record.get("query_id", 0)
            q_type = record.get("query_type", "UNKNOWN")
            raw_query = record.get("query", "")
            raw_eng_query = record.get("Eng_Query", "")

            passages_obj = record.get("passages", {}) or {}
            tr_passages = passages_obj.get("Translated_passages", []) or []
            en_passages = passages_obj.get("English_passages", []) or []
            is_selected = passages_obj.get("is_selected", []) or []

            for idx, p_text in enumerate(tr_passages):
                stats["input_passages"] += 1
                sel = is_selected[idx] if idx < len(is_selected) else 0
                en_text = en_passages[idx] if idx < len(en_passages) else ""

                doc = self.clean_document(
                    raw_text=p_text,
                    english_raw_text=en_text,
                    query_id=q_id,
                    passage_index=idx,
                    language=target_lang,
                    query_type=q_type,
                    is_selected=sel,
                    query=raw_query,
                    eng_query=raw_eng_query
                )
                if not doc:
                    stats["empty_or_short_skipped"] += 1
                    continue

                if deduplicate:
                    if doc["hash"] in seen_hashes:
                        stats["duplicates_skipped"] += 1
                        continue
                    seen_hashes.add(doc["hash"])

                cleaned_docs.append(doc)
                stats["valid_docs"] += 1

        return cleaned_docs, stats
