import os
import sys
import pytest

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.query import query_processor


def test_language_detection():
    # Hindi
    assert query_processor.detect_language("भारत की राजधानी क्या है?") == "hi"
    # English
    assert query_processor.detect_language("What is the capital of India?") == "en"
    # Hinglish
    assert query_processor.detect_language("India ka capital kya hai?") == "hinglish"
    # Bengali
    assert query_processor.detect_language("ভারতের রাজধানী কি?") == "bn"
    # Tamil
    assert query_processor.detect_language("இந்தியாவின் தலைநகரம் எது?") == "ta"
    # Telugu
    assert query_processor.detect_language("భారత రాజధాని ఏమిటి?") == "te"


def test_intent_classification():
    # Definition
    assert query_processor.classify_intent("कॉर्पोरेशन क्या है?") == "definition"
    assert query_processor.classify_intent("What is a corporation?") == "definition"
    # Factual
    assert query_processor.classify_intent("ताजमहल कब बना था?") == "factual"
    # Numeric
    assert query_processor.classify_intent("भारत में कितने राज्य हैं?") == "numeric"
    assert query_processor.classify_intent("How many people live in India?") == "numeric"
    # Comparison
    assert query_processor.classify_intent("Compare private vs public companies") == "comparison"


def test_keyword_extraction():
    out = query_processor.process("कॉर्पोरेशन क्या है?")
    assert "कॉर्पोरेशन" in out.keywords
    assert out.language == "hi"
    assert out.intent == "definition"
