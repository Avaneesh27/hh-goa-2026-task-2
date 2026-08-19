import os
import sys
import unittest

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ingestion.cleaner import TextCleaner


class TestCleaner(unittest.TestCase):

    def test_clean_text_html_stripping(self):
        cleaner = TextCleaner()
        raw = "<p>यह एक <b>परीक्षण</b> अनुच्छेद है। &nbsp; https://example.com</p>"
        cleaned = cleaner.clean_text(raw)
        self.assertNotIn("<p>", cleaned)
        self.assertNotIn("<b>", cleaned)
        self.assertNotIn("https://", cleaned)
        self.assertEqual(cleaned, "यह एक परीक्षण अनुच्छेद है।")

    def test_clean_text_unicode_normalization(self):
        cleaner = TextCleaner()
        text = "भारत एक महान देश है। यहाँ विभिन्न संस्कृतियाँ हैं।"
        cleaned = cleaner.clean_text(text)
        self.assertIn("।", cleaned)
        self.assertIn("भारत", cleaned)

    def test_clean_document_structure(self):
        cleaner = TextCleaner()
        doc = cleaner.clean_document(
            raw_text="कॉर्पोरेशन एक एकल इकाई के रूप में कार्य करता है।",
            query_id=101,
            passage_index=2,
            language="hi",
            is_selected=1
        )
        self.assertIsNotNone(doc)
        self.assertEqual(doc["document_id"], "doc_101_2_hi")
        self.assertTrue(doc["is_ground_truth"])
        self.assertEqual(doc["language"], "hi")
        self.assertGreater(doc["word_length"], 0)


if __name__ == "__main__":
    unittest.main()
