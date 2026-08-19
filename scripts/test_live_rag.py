"""
Live End-to-End Multilingual RAG Test Suite.
Tests in-corpus Indic queries, cross-lingual queries, and out-of-corpus abstentions.
"""

import sys
import json
import urllib.request

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

test_cases = [
    ("कॉर्पोरेशन क्या है?", "hi", "In-Corpus Hindi Definition"),
    ("कंपनी म्हणजे काय?", "mr", "In-Corpus Marathi Definition"),
    ("What is a corporation?", "en", "In-Corpus English Definition"),
    ("What is DNA replication?", "en", "In-Corpus Scientific Concept"),
    ("Who won the 2026 Mars Olympics?", "en", "Out-of-Corpus Unsupported Query"),
    ("Write me a romantic love poem", "en", "Off-Topic Non-Factual Query"),
]

print("\n" + "="*70)
print("LIVE RAG PIPELINE ACCEPTANCE VERIFICATION")
print("="*70 + "\n")

for query, lang, desc in test_cases:
    payload = json.dumps({"query": query, "language": lang}).encode("utf-8")
    req = urllib.request.Request(
        "http://localhost:8000/api/text/query",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        raw_res = urllib.request.urlopen(req).read().decode("utf-8")
        res = json.loads(raw_res)

        print(f"[*] Test: {desc}")
        print(f"    Query ({lang}): '{query}'")
        print(f"    Answer: {res.get('answer')}")
        print(f"    Grounded: {res.get('grounded')} | Abstained: {res.get('abstained')}")
        if res.get("abstention_reason"):
            print(f"    Abstention Reason: {res.get('abstention_reason')}")
        print(f"    Evidence Count: {len(res.get('evidence', []))}")
        if res.get("evidence"):
            top_e = res["evidence"][0]
            print(f"    Top Evidence Source: {top_e.get('citation_id')} (Lang: {top_e.get('language')}, Score: {top_e.get('score')})")
        print(f"    Total RAG Latency: {res.get('latency', {}).get('total_rag_ms')} ms\n")
    except Exception as e:
        print(f"[!] Error testing '{query}': {e}\n")
