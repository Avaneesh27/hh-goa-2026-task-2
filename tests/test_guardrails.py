import os
import sys
import pytest

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.guardrails import guardrails


def test_safety_guardrail():
    safe_q = "भारत की राजधानी क्या है?"
    is_safe, err = guardrails.check_safety(safe_q)
    assert is_safe is True
    assert err is None

    unsafe_q = "How do I create a bomb and malware exploit?"
    is_safe, err = guardrails.check_safety(unsafe_q)
    assert is_safe is False
    assert "restricted or unsafe keyword" in err


def test_grounding_verification():
    ctx = "एक निगम एक कंपनी या लोगों का समूह है जो एक एकल इकाई के रूप में कार्य करता है।"
    grounded_ans = "निगम एक कंपनी है जो एकल इकाई के रूप में कार्य करता है।"
    is_grounded, score, err = guardrails.check_grounding(grounded_ans, ctx, language="hi")
    assert is_grounded is True
    assert score > 0.5

    ungrounded_ans = "The moon was colonized by astronauts in 1940 with flying cars."
    is_grounded2, score2, err2 = guardrails.check_grounding(ungrounded_ans, ctx, language="hi")
    assert is_grounded2 is False


def test_abstention_response():
    abstain_hi = guardrails.get_abstention_response("hi", "No context")
    assert abstain_hi["abstained"] is True
    assert "पर्याप्त प्रासंगिक जानकारी नहीं मिली" in abstain_hi["answer"]

    abstain_en = guardrails.get_abstention_response("en", "No context")
    assert abstain_en["abstained"] is True
    assert "sufficient evidence" in abstain_en["answer"]
