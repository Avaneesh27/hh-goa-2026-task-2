import os
import sys
import unittest
import base64
import asyncio
from unittest.mock import patch, AsyncMock

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.tts import sarvam_tts_service, SARVAM_TTS_LANG_MAP


class MockResponse:
    def __init__(self, status_code: int, json_data: dict, text: str = "") -> None:
        self.status_code = status_code
        self._json_data = json_data
        self.text = text

    def json(self) -> dict:
        return self._json_data


class TestTTS(unittest.TestCase):

    def test_tts_language_mapping(self):
        self.assertEqual(SARVAM_TTS_LANG_MAP["hi"], "hi-IN")
        self.assertEqual(SARVAM_TTS_LANG_MAP["bn"], "bn-IN")
        self.assertEqual(SARVAM_TTS_LANG_MAP["en"], "en-IN")
        self.assertEqual(SARVAM_TTS_LANG_MAP["hinglish"], "hi-IN")
        self.assertEqual(SARVAM_TTS_LANG_MAP.get("mr"), "mr-IN")
        self.assertIsNone(SARVAM_TTS_LANG_MAP.get("as"))
        self.assertIsNone(SARVAM_TTS_LANG_MAP.get("ne"))

    def test_sarvam_tts_service_unsupported_language(self):
        async def run():
            base64_audio, err = await sarvam_tts_service.text_to_speech(
                text="Hello",
                language_code="as"
            )
            self.assertIsNone(base64_audio)
            self.assertIn("not supported", err)
        asyncio.run(run())

    def test_sarvam_tts_service_empty_text(self):
        async def run():
            base64_audio, err = await sarvam_tts_service.text_to_speech(
                text="",
                language_code="hi"
            )
            self.assertIsNone(base64_audio)
            self.assertIn("cannot be empty", err)
        asyncio.run(run())

    @patch("httpx.AsyncClient.post")
    def test_sarvam_tts_service_mock_success(self, mock_post):
        mock_base64_audio = base64.b64encode(b"mock_wav_data").decode("utf-8")
        mock_post.return_value = MockResponse(200, {"request_id": "test_id", "audios": [mock_base64_audio]})

        async def run():
            base64_audio, err = await sarvam_tts_service.text_to_speech(
                text="This is a test of the narration system.",
                language_code="en",
                speaker="shubh"
            )
            self.assertIsNone(err)
            self.assertEqual(base64_audio, mock_base64_audio)
            self.assertEqual(base64.b64decode(base64_audio), b"mock_wav_data")
        asyncio.run(run())

    @patch("httpx.AsyncClient.post")
    def test_sarvam_tts_service_mock_failure(self, mock_post):
        mock_post.return_value = MockResponse(500, {}, text="Internal Server Error")

        async def run():
            base64_audio, err = await sarvam_tts_service.text_to_speech(
                text="This is a test of the narration system.",
                language_code="en"
            )
            self.assertIsNone(base64_audio)
            self.assertIn("HTTP 500", err)
        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
