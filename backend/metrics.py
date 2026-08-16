"""
Latency Instrumentation and Metrics Collector for RAG Pipeline.
Uses monotonic high-precision timers (time.perf_counter) to measure and record
sub-millisecond execution times for every pipeline stage.
"""

import time
from typing import Dict, Any, List
from backend.schemas import LatencyBreakdown


class StageTimer:
    def __init__(self):
        self._start_times: Dict[str, float] = {}
        self.durations_ms: Dict[str, float] = {}
        self._total_start = time.perf_counter()

    def start(self, stage_name: str):
        self._start_times[stage_name] = time.perf_counter()

    def stop(self, stage_name: str) -> float:
        if stage_name in self._start_times:
            elapsed = (time.perf_counter() - self._start_times[stage_name]) * 1000
            self.durations_ms[stage_name] = round(elapsed, 2)
            return self.durations_ms[stage_name]
        return 0.0

    def get_breakdown(self) -> LatencyBreakdown:
        total_e2e = round((time.perf_counter() - self._total_start) * 1000, 2)
        total_rag = sum(v for k, v in self.durations_ms.items() if k != "stt")
        
        return LatencyBreakdown(
            stt_ms=self.durations_ms.get("stt", 0.0),
            query_processing_ms=self.durations_ms.get("query_processing", 0.0),
            embedding_ms=self.durations_ms.get("embedding", 0.0),
            dense_retrieval_ms=self.durations_ms.get("dense_retrieval", 0.0),
            bm25_ms=self.durations_ms.get("bm25", 0.0),
            fusion_ms=self.durations_ms.get("fusion", 0.0),
            reranking_ms=self.durations_ms.get("reranking", 0.0),
            context_selection_ms=self.durations_ms.get("context_selection", 0.0),
            generation_ms=self.durations_ms.get("generation", 0.0),
            guardrails_ms=self.durations_ms.get("guardrails", 0.0),
            total_rag_ms=round(total_rag, 2),
            end_to_end_ms=total_e2e
        )
