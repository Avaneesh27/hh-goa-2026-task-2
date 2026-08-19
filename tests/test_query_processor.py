import os
import sys
import unittest

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.query import query_processor


class TestQueryProcessor(unittest.TestCase):

    def test_language_detection(self):
        # Hindi
        self.assertEqual(query_processor.detect_language("भारत की राजधानी क्या है?"), "hi")
        # English
        self.assertEqual(query_processor.detect_language("What is the capital of India?"), "en")
        # Hinglish
        self.assertEqual(query_processor.detect_language("India ka capital kya hai?"), "hinglish")
        # Bengali
        self.assertEqual(query_processor.detect_language("ভারতের রাজধানী কি?"), "bn")
        # Tamil
        self.assertEqual(query_processor.detect_language("இந்தியாவின் தலைநகரம் எது?"), "ta")
        # Telugu
        self.assertEqual(query_processor.detect_language("భారత రాజధాని ఏమిటి?"), "te")

    def test_intent_classification(self):
        # Definition
        self.assertEqual(query_processor.classify_intent("कॉर्पोरेशन क्या है?"), "definition")
        self.assertEqual(query_processor.classify_intent("What is a corporation?"), "definition")
        # Factual
        self.assertEqual(query_processor.classify_intent("ताजमहल कब बना था?"), "factual")
        # Numeric
        self.assertEqual(query_processor.classify_intent("भारत में कितने राज्य हैं?"), "numeric")
        self.assertEqual(query_processor.classify_intent("How many people live in India?"), "numeric")
        # Comparison
        self.assertEqual(query_processor.classify_intent("Compare private vs public companies"), "comparison")

    def test_keyword_extraction(self):
        out = query_processor.process("कॉर्पोरेशन क्या है?")
        self.assertIn("कॉर्पोरेशन", out.keywords)
        self.assertEqual(out.language, "hi")
        self.assertEqual(out.intent, "definition")


if __name__ == "__main__":
    unittest.main()
