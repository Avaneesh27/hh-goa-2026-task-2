"""
Typed Pydantic Schemas for Voice-Enabled RAG System.
Defines schemas for STT, Query Processing, Retrieval, Generation, Guardrails,
Latency Breakdowns, and End-to-End Responses.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class STTResponse(BaseModel):
    text: str
    language: str
    confidence: float
    latency_ms: float
    is_fallback: bool = False
    error: Optional[str] = None


class QueryProcessingOutput(BaseModel):
    original_query: str
    normalized_query: str
    retrieval_query: str
    language: str  # "hi", "en", "hinglish", "unknown"
    intent: str    # "factual", "definition", "numeric", "comparison", "procedural", "ambiguous"
    keywords: List[str] = Field(default_factory=list)
    metadata_filters: Dict[str, Any] = Field(default_factory=dict)
    retrieval_strategy: str = "hybrid"
    latency_ms: float = 0.0


class EvidenceChunk(BaseModel):
    citation_id: str
    chunk_id: str
    document_id: str
    text: str
    language: str
    score: float
    level: Optional[str] = "sentence_group"
    strategy: Optional[str] = "sentence_aware"
    position: Optional[int] = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LatencyBreakdown(BaseModel):
    stt_ms: float = 0.0
    query_processing_ms: float = 0.0
    embedding_ms: float = 0.0
    dense_retrieval_ms: float = 0.0
    bm25_ms: float = 0.0
    fusion_ms: float = 0.0
    reranking_ms: float = 0.0
    context_selection_ms: float = 0.0
    generation_ms: float = 0.0
    guardrails_ms: float = 0.0
    total_rag_ms: float = 0.0
    end_to_end_ms: float = 0.0


class RetrievalStats(BaseModel):
    strategy: str = "hybrid_rrf"
    dense_count: int = 0
    bm25_count: int = 0
    fused_count: int = 0
    reranked_count: int = 0
    selected_count: int = 0


class RAGResponse(BaseModel):
    request_id: str
    transcript: str
    language: str
    answer: str
    confidence: float
    grounded: bool
    abstained: bool
    abstention_reason: Optional[str] = None
    retrieval: RetrievalStats
    evidence: List[EvidenceChunk]
    latency: LatencyBreakdown
    execution_trace: List[str]


class TextQueryRequest(BaseModel):
    query: str
    language: Optional[str] = None
    filter_language: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    dataset_collection: str
    indexed_chunks: int
    embedding_model: str
    reranker_model: str
    llm_provider: str
    llm_model: str
