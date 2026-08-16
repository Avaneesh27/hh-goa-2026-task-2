"""
Data Cleaning Pipeline for MSMARCO-XI Dataset.
Normalizes Unicode, strips HTML tags/entities, cleans whitespace, preserves Hindi/Devanagari
matras, danda (।), punctuation, numbers, and assigns deterministic document IDs with metadata.
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
        Cleans and normalizes text while preserving Hindi Devanagari characters,
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

        # 5. Clean URLs to a clean token or remove if trailing
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
        language: str = "hi",
        query_type: Optional[str] = None,
        is_selected: int = 0,
        source: str = "msmarco-xi"
    ) -> Optional[Dict[str, Any]]:
        """
        Cleans a single passage and packages it into a structured document.
        Returns None if document is empty or below minimum character threshold.
        """
        cleaned = self.clean_text(raw_text)
        if not cleaned or len(cleaned) < 15:
            return None

        # Deterministic document ID
        doc_id = f"doc_{query_id}_{passage_index}_{language}"

        return {
            "document_id": doc_id,
            "query_id": query_id,
            "passage_index": passage_index,
            "language": language,
            "source": source,
            "query_type": query_type or "UNKNOWN",
            "is_ground_truth": bool(is_selected),
            "text": cleaned,
            "char_length": len(cleaned),
            "word_length": len(cleaned.split()),
            "hash": hashlib.md5(cleaned.encode("utf-8")).hexdigest()
        }

    def clean_batch(
        self,
        records: List[Dict[str, Any]],
        target_lang: str = "hi",
        deduplicate: bool = True
    ) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        """
        Processes a batch of dataset records, extracts and cleans both Hindi and English passages.
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
            passages_obj = record.get("passages", {}) or {}
            
            tr_passages = passages_obj.get("Translated_passages", []) or []
            en_passages = passages_obj.get("English_passages", []) or []
            is_selected = passages_obj.get("is_selected", []) or []

            # Process target language passages (Hindi)
            for idx, p_text in enumerate(tr_passages):
                stats["input_passages"] += 1
                sel = is_selected[idx] if idx < len(is_selected) else 0
                doc = self.clean_document(
                    raw_text=p_text,
                    query_id=q_id,
                    passage_index=idx,
                    language=target_lang,
                    query_type=q_type,
                    is_selected=sel
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


if __name__ == "__main__":
    import sys
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
    cleaner = TextCleaner()
    sample_noisy_hindi = " <p>एक कंपनी <b>भारत</b> में निगमित होती है। &nbsp; https://example.com/info </p> "
    cleaned = cleaner.clean_text(sample_noisy_hindi)
    print("Original:", repr(sample_noisy_hindi))
    print("Cleaned:", repr(cleaned))
    doc = cleaner.clean_document(sample_noisy_hindi, query_id=101, passage_index=0, language="hi")
    print("Doc Object:", doc)
