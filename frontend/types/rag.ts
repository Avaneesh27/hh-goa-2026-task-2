export interface EvidenceChunk {
  citation_id: string;
  chunk_id: string;
  document_id: string;
  text: string;
  language: string;
  score: number;
  level?: string;
  strategy?: string;
  position?: number;
  metadata?: Record<string, any>;
}

export interface LatencyBreakdown {
  stt_ms: number;
  query_processing_ms: number;
  embedding_ms: number;
  dense_retrieval_ms: number;
  bm25_ms: number;
  fusion_ms: number;
  reranking_ms: number;
  context_selection_ms: number;
  generation_ms: number;
  guardrails_ms: number;
  total_rag_ms: number;
  end_to_end_ms: number;
}

export interface RetrievalStats {
  strategy: string;
  dense_count: number;
  bm25_count: number;
  fused_count: number;
  reranked_count: number;
  selected_count: number;
}

export interface RAGResponse {
  request_id: string;
  transcript: string;
  language: string;
  answer: string;
  confidence: number;
  grounded: boolean;
  abstained: boolean;
  abstention_reason?: string;
  retrieval: RetrievalStats;
  evidence: EvidenceChunk[];
  latency: LatencyBreakdown;
  execution_trace: string[];
  audio_base64?: string;
}

export interface HealthInfo {
  status: string;
  timestamp: string;
  dataset_collection: string;
  indexed_chunks: number;
  embedding_model: string;
  reranker_model: string;
  llm_provider: string;
  llm_model: string;
}
