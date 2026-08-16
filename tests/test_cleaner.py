import os
import sys
import pytest

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ingestion.cleaner import TextCleaner


def test_clean_text_html_stripping():
    cleaner = TextCleaner()
    raw = "<p>यह एक <b>परीक्षण</b> अनुच्छेद है। &nbsp; https://example.com</p>"
    cleaned = cleaner.clean_text(raw)
    assert "<p>" not in cleaned
    assert "<b>" not in cleaned
    assert "https://" not in cleaned
    assert "यह एक परीक्षण अनुच्छेद है।" == cleaned


def test_clean_text_unicode_normalization():
    cleaner = TextCleaner()
    # Preserves Devanagari matras and danda
    text = "भारत एक महान देश है। यहाँ विभिन्न संस्कृतियाँ हैं।"
    cleaned = cleaner.clean_text(text)
    assert "।" in cleaned
    assert "भारत" in cleaned


def test_clean_document_structure():
    cleaner = TextCleaner()
    doc = cleaner.clean_document(
        raw_text="कॉर्पोरेशन एक एकल इकाई के रूप में कार्य करता है।",
        query_id=101,
        passage_index=2,
        language="hi",
        is_selected=1
    )
    assert doc is not None
    assert doc["document_id"] == "doc_101_2_hi"
    assert doc["is_ground_truth"] is True
    assert doc["language"] == "hi"
    assert doc["word_length"] > 0
