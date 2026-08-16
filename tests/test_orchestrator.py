import os
import sys
import asyncio

# Ensure root workspace directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.orchestrator import rag_orchestrator


async def main():
    print("=================================================================")
    print("TEST 1: In-Corpus Hindi Query ('कॉर्पोरेशन क्या है?')")
    print("=================================================================")
    resp1 = await rag_orchestrator.process_text_query("कॉर्पोरेशन क्या है?")
    print("Answer:", resp1.answer)
    print("Language:", resp1.language)
    print("Grounded:", resp1.grounded, "| Abstained:", resp1.abstained)
    print("Evidence Chunks:", len(resp1.evidence))
    print("Total RAG Latency:", resp1.latency.total_rag_ms, "ms")
    print("Trace:", resp1.execution_trace)

    print("\n=================================================================")
    print("TEST 2: Out-of-Corpus Unsupported Query ('Who won the 2026 Mars Olympics?')")
    print("=================================================================")
    resp2 = await rag_orchestrator.process_text_query("Who won the 2026 Mars Olympics?")
    print("Answer:", resp2.answer)
    print("Grounded:", resp2.grounded, "| Abstained:", resp2.abstained)
    print("Abstention Reason:", resp2.abstention_reason)
    print("Total RAG Latency:", resp2.latency.total_rag_ms, "ms")


if __name__ == "__main__":
    asyncio.run(main())
