import os
import sys

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.retrieval import hybrid_retriever

def test_search():
    query = "कॉर्पोरेशन क्या है?"
    res = hybrid_retriever.retrieve(query, dense_top_k=10, bm25_top_k=10)
    print("Query:", res["query"])
    print("Counts:", res["counts"])
    print("Timings (ms):", res["timings_ms"])
    print("\n--- Top 3 Fused Candidates ---")
    for i, r in enumerate(res["fused_results"][:3], 1):
        print(f"#{i} score={r['score']} (dense_rank={r['dense_rank']}, bm25_rank={r['bm25_rank']})")
        print(f"   Doc ID: {r['document_id']}")
        print(f"   Text: {r['text'][:140]}...\n")

if __name__ == "__main__":
    test_search()
