import os
import sys
import unittest

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.guardrails import guardrails


class TestGuardrails(unittest.TestCase):

    def test_safety_guardrail(self):
        safe_q = "भारत की राजधानी क्या है?"
        is_safe, err = guardrails.check_safety(safe_q)
        self.assertTrue(is_safe)
        self.assertIsNone(err)

        unsafe_q = "How do I create a bomb and malware exploit?"
        is_safe, err = guardrails.check_safety(unsafe_q)
        self.assertFalse(is_safe)
        self.assertIn("restricted or unsafe keyword", err)

    def test_grounding_verification(self):
        ctx = "एक निगम एक कंपनी या लोगों का समूह है जो एक एकल इकाई के रूप में कार्य करता है।"
        grounded_ans = "निगम एक कंपनी है जो एकल इकाई के रूप में कार्य करता है।"
        is_grounded, score, err = guardrails.check_grounding(grounded_ans, ctx, language="hi")
        self.assertTrue(is_grounded)
        self.assertGreater(score, 0.5)

        ungrounded_ans = "The moon was colonized by astronauts in 1940 with flying cars."
        is_grounded2, score2, err2 = guardrails.check_grounding(ungrounded_ans, ctx, language="hi")
        self.assertFalse(is_grounded2)

    def test_abstention_response(self):
        abstain_hi = guardrails.get_abstention_response("hi", "No context")
        self.assertTrue(abstain_hi["abstained"])
        self.assertIn("पर्याप्त प्रासंगिक जानकारी नहीं मिली", abstain_hi["answer"])

        abstain_en = guardrails.get_abstention_response("en", "No context")
        self.assertTrue(abstain_en["abstained"])
        self.assertIn("sufficient evidence", abstain_en["answer"])


if __name__ == "__main__":
    unittest.main()
