import os
import sys
import pytest
import io
import wave
import struct

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.stt import sarvam_stt_service
from backend.generation import answer_generator
from backend.guardrails import guardrails
from backend.query import query_processor


def create_dummy_wav(duration_s: float = 0.5, sample_rate: int = 16000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        # Silence
        num_samples = int(duration_s * sample_rate)
        wf.writeframes(struct.pack('<' + 'h' * num_samples, *([0] * num_samples)))
    return buf.getvalue()


def test_stt_audio_validation():
    # Test valid wav
    wav_bytes = create_dummy_wav()
    valid, err = sarvam_stt_service.validate_audio(wav_bytes, "voice.wav")
    assert valid is True
    assert err is None

    # Test empty audio
    valid, err = sarvam_stt_service.validate_audio(b"", "voice.wav")
    assert valid is False
    assert "too short" in err


def test_extractive_answer_no_bangla_for_english():
    # Context with mixed language passages (Hindi, Bengali, Marathi)
    context = (
        "Source [1]\n"
        "कॉर्पोरेशन (निगम) की परिभाषा, व्यक्तियों का एक समूह जो कानून द्वारा बनाया गया है।\n\n"
        "Source [2]\n"
        "এই প্রশ্নের উত্তর দেওয়ার জন্য তথ্য। কর্পোরেশন একটি আইনি সত্তা।\n\n"
        "Source [3]\n"
        "मॅकडोनाल्ड कॉर्पोरेशन ही जगातील सर्वात मोठी संस्था आहे."
    )

    # For an English query, extractive synthesizer must NOT pick Bengali script
    ans_en = answer_generator._deterministic_extractive_answer(
        query="what is a corporation?",
        context_text=context,
        language="en",
        start_time=0.0
    )
    assert ans_en["is_abstained"] is False
    assert not any(ord(c) >= 0x0980 and ord(c) <= 0x09FF for c in ans_en["answer"])
    print("English query answer:", ans_en["answer"])

    # For a Hindi query, it should pick Hindi/Devanagari
    ans_hi = answer_generator._deterministic_extractive_answer(
        query="कॉर्पोरेशन क्या है?",
        context_text=context,
        language="hi",
        start_time=0.0
    )
    assert ans_hi["is_abstained"] is False
    assert "निगम" in ans_hi["answer"]


def test_guardrails_abstention_language():
    # English query abstention
    abs_en = guardrails.get_abstention_response("en")
    assert "evidence" in abs_en["answer"]
    assert "पर्याप्त" not in abs_en["answer"]

    # Hindi query abstention
    abs_hi = guardrails.get_abstention_response("hi")
    assert "पर्याप्त" in abs_hi["answer"]

    # Bengali query abstention
    abs_bn = guardrails.get_abstention_response("bn")
    assert "পর্যাপ্ত" in abs_bn["answer"]
