"""
Master RAG Orchestrator Harness.
Coordinates the deterministic execution pipeline:
  Voice/Text Input -> STT -> Query Processing -> Safety -> Hybrid Retrieval (Dense+BM25)
  -> RRF Fusion -> Relevance Guard -> Reranker -> Context Selector -> Grounded Generation
  -> Grounding Guard -> Response Formatter with Latency Instrumentation.
"""

import time
import uuid
from typing import Dict, Any, Optional, List

from backend.config import settings
from backend.schemas import (
    RAGResponse,
    RetrievalStats,
    EvidenceChunk,
    LatencyBreakdown
)
from backend.metrics import StageTimer
from backend.stt import sarvam_stt_service
from backend.query import query_processor
from backend.retrieval import hybrid_retriever
from backend.reranker import reranker
from backend.context import context_selector
from backend.generation import answer_generator
from backend.guardrails import guardrails


class RAGOrchestrator:
    def __init__(self):
        self.stt = sarvam_stt_service
        self.query_processor = query_processor
        self.retriever = hybrid_retriever
        self.reranker = reranker
        self.context_selector = context_selector
        self.generator = answer_generator
        self.guardrails = guardrails

    async def process_text_query(
        self,
        query: str,
        language: Optional[str] = None,
        filter_language: Optional[str] = None
    ) -> RAGResponse:
        """Processes a plain text query through the complete deterministic RAG pipeline."""
        timer = StageTimer()
        request_id = str(uuid.uuid4())
        execution_trace = []

        # 1. Query Processing
        timer.start("query_processing")
        q_proc = self.query_processor.process(query, language=language, filter_language=filter_language)
        timer.stop("query_processing")
        detected_lang = q_proc.language
        execution_trace.append(f"✓ Language detected: {detected_lang.upper()} ({q_proc.intent} intent)")
        execution_trace.append(f"✓ Query normalized & {len(q_proc.keywords)} keywords extracted")

        # 2. Safety Guardrail
        timer.start("guardrails")
        is_safe, safety_err = self.guardrails.check_safety(q_proc.normalized_query)
        if not is_safe:
            timer.stop("guardrails")
            abstain_data = self.guardrails.get_abstention_response(detected_lang, reason=safety_err)
            execution_trace.append(f"⚠ Safety guardrail triggered: {safety_err}")
            return self._build_response(
                request_id=request_id,
                transcript=query,
                language=detected_lang,
                answer=abstain_data["answer"],
                confidence=0.0,
                grounded=False,
                abstained=True,
                abstention_reason=safety_err,
                retrieval_stats=RetrievalStats(),
                evidence=[],
                timer=timer,
                execution_trace=execution_trace
            )
        execution_trace.append("✓ Safety checks passed")

        # 3. Hybrid Retrieval (Dense + BM25 + RRF)
        timer.start("dense_retrieval")
        timer.start("bm25")
        timer.start("fusion")
        ret_out = self.retriever.retrieve(
            query=q_proc.retrieval_query,
            dense_top_k=settings.DENSE_TOP_K,
            bm25_top_k=settings.BM25_TOP_K,
            rrf_k=settings.RRF_K,
            fused_top_k=settings.DENSE_TOP_K,
            filter_language=filter_language
        )
        timer.durations_ms["embedding"] = ret_out["timings_ms"]["embedding_ms"]
        timer.durations_ms["dense_retrieval"] = ret_out["timings_ms"]["dense_retrieval_ms"]
        timer.durations_ms["bm25"] = ret_out["timings_ms"]["bm25_ms"]
        timer.durations_ms["fusion"] = ret_out["timings_ms"]["fusion_ms"]
        execution_trace.append(f"✓ Hybrid search complete (Dense: {ret_out['counts']['dense']}, BM25: {ret_out['counts']['bm25']})")
        execution_trace.append(f"✓ Reciprocal Rank Fusion complete ({ret_out['counts']['fused']} candidates)")

        # 4. Relevance Guardrail
        is_relevant, rel_err = self.guardrails.check_relevance(q_proc.normalized_query, ret_out)
        if not is_relevant:
            timer.stop("guardrails")
            abstain_data = self.guardrails.get_abstention_response(detected_lang, reason=rel_err)
            execution_trace.append(f"⚠ Relevance check: {rel_err}")
            return self._build_response(
                request_id=request_id,
                transcript=query,
                language=detected_lang,
                answer=abstain_data["answer"],
                confidence=0.0,
                grounded=False,
                abstained=True,
                abstention_reason=rel_err,
                retrieval_stats=RetrievalStats(
                    dense_count=ret_out["counts"]["dense"],
                    bm25_count=ret_out["counts"]["bm25"],
                    fused_count=ret_out["counts"]["fused"]
                ),
                evidence=[],
                timer=timer,
                execution_trace=execution_trace
            )
        execution_trace.append("✓ Relevance threshold confirmed")

        # 5. Reranking
        timer.start("reranking")
        rerank_out = self.reranker.rerank(
            query=q_proc.normalized_query,
            candidates=ret_out["fused_results"],
            top_k=settings.RERANK_TOP_K
        )
        timer.stop("reranking")

        # 5b. Rerank Confidence Check
        is_confident, rerank_err = self.guardrails.check_rerank_confidence(rerank_out["reranked_results"])
        if not is_confident:
            abstain_data = self.guardrails.get_abstention_response(detected_lang, reason=rerank_err)
            execution_trace.append(f"⚠ Rerank confidence guardrail: {rerank_err}")
            return self._build_response(
                request_id=request_id,
                transcript=query,
                language=detected_lang,
                answer=abstain_data["answer"],
                confidence=0.0,
                grounded=False,
                abstained=True,
                abstention_reason=rerank_err,
                retrieval_stats=RetrievalStats(
                    dense_count=ret_out["counts"]["dense"],
                    bm25_count=ret_out["counts"]["bm25"],
                    fused_count=ret_out["counts"]["fused"],
                    reranked_count=len(rerank_out["reranked_results"])
                ),
                evidence=[],
                timer=timer,
                execution_trace=execution_trace
            )
        execution_trace.append(f"✓ Multilingual reranker filtered to Top {len(rerank_out['reranked_results'])} evidence chunks")

        # 6. Context Selection & Deduplication
        timer.start("context_selection")
        ctx_out = self.context_selector.select_context(
            ranked_chunks=rerank_out["reranked_results"],
            max_chunks=settings.MAX_CONTEXT_CHUNKS,
            max_tokens=settings.MAX_CONTEXT_TOKENS
        )
        timer.stop("context_selection")

        if ctx_out["is_empty"]:
            abstain_data = self.guardrails.get_abstention_response(detected_lang, reason="No suitable context after deduplication.")
            execution_trace.append("⚠ Context selector returned empty context")
            return self._build_response(
                request_id=request_id,
                transcript=query,
                language=detected_lang,
                answer=abstain_data["answer"],
                confidence=0.0,
                grounded=False,
                abstained=True,
                abstention_reason="Empty context after deduplication",
                retrieval_stats=RetrievalStats(
                    dense_count=ret_out["counts"]["dense"],
                    bm25_count=ret_out["counts"]["bm25"],
                    fused_count=ret_out["counts"]["fused"],
                    reranked_count=len(rerank_out["reranked_results"]),
                    selected_count=0
                ),
                evidence=[],
                timer=timer,
                execution_trace=execution_trace
            )
        execution_trace.append(f"✓ Selected {ctx_out['selected_count']} non-redundant evidence passages ({ctx_out['total_words']} words)")

        # 7. Grounded Generation
        timer.start("generation")
        gen_out = await self.generator.generate_answer(
            query=q_proc.normalized_query,
            context_text=ctx_out["context_text"],
            language=detected_lang
        )
        timer.stop("generation")

        # 8. Grounding Guardrail
        timer.start("guardrails")
        is_grounded, grounding_score, ground_err = self.guardrails.check_grounding(
            answer=gen_out["answer"],
            context_text=ctx_out["context_text"],
            language=detected_lang
        )
        
        # Controlled retry once if ungrounded
        if not is_grounded and not gen_out["is_abstained"]:
            execution_trace.append("↻ Grounding check failed; retrying generation once with strict constraint")
            gen_out = await self.generator.generate_answer(
                query=q_proc.normalized_query,
                context_text=ctx_out["context_text"],
                language=detected_lang,
                is_retry=True
            )
            is_grounded, grounding_score, ground_err = self.guardrails.check_grounding(
                answer=gen_out["answer"],
                context_text=ctx_out["context_text"],
                language=detected_lang
            )
        timer.stop("guardrails")

        # If model explicitly abstained or failed grounding after retry
        if gen_out["is_abstained"] or not is_grounded:
            abstain_data = self.guardrails.get_abstention_response(detected_lang, reason=ground_err)
            execution_trace.append(f"✓ System safely abstained: {ground_err}")
            answer_text = abstain_data["answer"]
            is_abstained = True
            is_grounded = False
            confidence = 0.0
        else:
            answer_text = gen_out["answer"]
            is_abstained = False
            is_grounded = True
            confidence = gen_out.get("confidence", 0.92)
            execution_trace.append(f"✓ Grounding verified (Score: {grounding_score:.2f})")
            execution_trace.append(f"✓ Final answer generated ({gen_out.get('provider')})")

        # Convert selected chunks to EvidenceChunk models
        evidence_chunks = [
            EvidenceChunk(
                citation_id=c.get("citation_id", "[1]"),
                chunk_id=c.get("chunk_id", "c"),
                document_id=c.get("document_id", "doc"),
                text=c.get("text", ""),
                language=c.get("language", "hi"),
                score=c.get("score", 0.0),
                level=c.get("level", "sentence_group"),
                strategy=c.get("strategy", "sentence_aware"),
                position=c.get("position", 0),
                metadata=c.get("metadata", {})
            )
            for c in ctx_out["selected_chunks"]
        ]

        retrieval_stats = RetrievalStats(
            strategy=q_proc.retrieval_strategy,
            dense_count=ret_out["counts"]["dense"],
            bm25_count=ret_out["counts"]["bm25"],
            fused_count=ret_out["counts"]["fused"],
            reranked_count=len(rerank_out["reranked_results"]),
            selected_count=ctx_out["selected_count"]
        )

        return self._build_response(
            request_id=request_id,
            transcript=query,
            language=detected_lang,
            answer=answer_text,
            confidence=confidence,
            grounded=is_grounded,
            abstained=is_abstained,
            abstention_reason=ground_err if is_abstained else None,
            retrieval_stats=retrieval_stats,
            evidence=evidence_chunks,
            timer=timer,
            execution_trace=execution_trace
        )

    async def process_voice_query(
        self,
        audio_bytes: bytes,
        filename: str = "recording.wav",
        language_hint: Optional[str] = None,
        transcript_fallback: Optional[str] = None
    ) -> RAGResponse:
        """Processes voice input through STT and the RAG orchestrator."""
        timer = StageTimer()
        request_id = str(uuid.uuid4())
        execution_trace = ["✓ Audio stream received and validated"]

        # 1. Speech-To-Text
        timer.start("stt")
        stt_resp = await self.stt.transcribe(
            audio_bytes=audio_bytes,
            filename=filename,
            language_code=language_hint
        )
        timer.stop("stt")

        final_query_text = (stt_resp.text or "").strip()
        detected_stt_lang = stt_resp.language

        # If Sarvam STT returned empty or unconfigured, use live transcript fallback from browser
        if not final_query_text and transcript_fallback and transcript_fallback.strip():
            final_query_text = transcript_fallback.strip()
            detected_stt_lang = language_hint or "hi"
            execution_trace.append(f"✓ Speech transcribed via Audio Engine: \"{final_query_text}\"")
        elif final_query_text:
            execution_trace.append(f"✓ Speech transcribed via Sarvam STT: \"{final_query_text}\" ({stt_resp.latency_ms}ms)")
        else:
            timer.durations_ms["stt"] = stt_resp.latency_ms
            err_msg = stt_resp.error or "Audio unrecognizable. Please speak clearly into your microphone."
            execution_trace.append(f"⚠ STT Notice: {err_msg}")
            abstain_data = self.guardrails.get_abstention_response("en", reason=err_msg)
            return self._build_response(
                request_id=request_id,
                transcript="(audio unrecognizable)",
                language="unknown",
                answer=abstain_data["answer"],
                confidence=0.0,
                grounded=False,
                abstained=True,
                abstention_reason=err_msg,
                retrieval_stats=RetrievalStats(),
                evidence=[],
                timer=timer,
                execution_trace=execution_trace
            )

        # Continue through full text RAG pipeline
        rag_resp = await self.process_text_query(
            query=final_query_text,
            language=detected_stt_lang
        )

        # Merge STT latency and trace
        rag_resp.latency.stt_ms = stt_resp.latency_ms
        rag_resp.latency.end_to_end_ms = round(rag_resp.latency.total_rag_ms + stt_resp.latency_ms, 2)
        rag_resp.execution_trace = execution_trace + rag_resp.execution_trace

        return rag_resp

    def _build_response(
        self,
        request_id: str,
        transcript: str,
        language: str,
        answer: str,
        confidence: float,
        grounded: bool,
        abstained: bool,
        abstention_reason: Optional[str],
        retrieval_stats: RetrievalStats,
        evidence: List[EvidenceChunk],
        timer: StageTimer,
        execution_trace: List[str]
    ) -> RAGResponse:
        latency = timer.get_breakdown()
        return RAGResponse(
            request_id=request_id,
            transcript=transcript,
            language=language,
            answer=answer,
            confidence=confidence,
            grounded=grounded,
            abstained=abstained,
            abstention_reason=abstention_reason,
            retrieval=retrieval_stats,
            evidence=evidence,
            latency=latency,
            execution_trace=execution_trace
        )


# Global singleton
rag_orchestrator = RAGOrchestrator()
