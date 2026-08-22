/**
 * RAG Backend API Client
 * Typed fetch wrappers for all FastAPI backend endpoints.
 * Uses relative paths — Vite dev proxy forwards to http://localhost:8000.
 */

// ─── Response Types (match backend schemas.py) ────────────────────────────────

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
  metadata?: Record<string, unknown>;
}

export interface RetrievalStats {
  strategy: string;
  dense_count: number;
  bm25_count: number;
  fused_count: number;
  reranked_count: number;
  selected_count: number;
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

export interface RAGResponse {
  request_id: string;
  transcript: string;
  language: string;
  answer: string;
  confidence: number;
  grounded: boolean;
  abstained: boolean;
  abstention_reason?: string | null;
  retrieval: RetrievalStats;
  evidence: EvidenceChunk[];
  latency: LatencyBreakdown;
  execution_trace: string[];
  audio_base64?: string | null;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  dataset_collection: string;
  indexed_chunks: number;
  embedding_model: string;
  reranker_model: string;
  llm_provider: string;
  llm_model: string;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

const BASE = ""; // relative — Vite proxy handles forwarding to backend

/**
 * Send a plain-text query through the full RAG pipeline.
 */
export async function textQuery(
  query: string,
  language?: string,
  filterLanguage?: string
): Promise<RAGResponse> {
  const res = await fetch(`${BASE}/api/text/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      language: language ?? null,
      filter_language: filterLanguage ?? null,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Text query failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<RAGResponse>;
}

/**
 * Send audio blob through STT -> RAG pipeline.
 * Optionally pass a browser-captured transcript as fallback when STT API key is missing.
 */
export async function voiceQuery(
  audioBlob: Blob,
  language?: string,
  transcript?: string
): Promise<RAGResponse> {
  const form = new FormData();
  const filename = audioBlob.type.includes("webm") ? "recording.webm" : "recording.wav";
  form.append("file", audioBlob, filename);
  if (language) form.append("language", language);
  if (transcript) form.append("transcript", transcript);

  const res = await fetch(`${BASE}/api/voice/query`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voice query failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<RAGResponse>;
}

/**
 * Synthesise speech for the given text and language.
 * Returns a temporary object URL pointing to WAV audio data.
 * The caller must call URL.revokeObjectURL(url) when done.
 */
export async function textToSpeech(
  text: string,
  language: string,
  speaker: string = "shubh"
): Promise<string> {
  const res = await fetch(`${BASE}/api/text-to-speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language, speaker }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS failed (${res.status}): ${err}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Fetch supported languages from the backend.
 */
export async function fetchLanguages(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/api/languages`);
  if (!res.ok) throw new Error("Failed to fetch languages");
  return res.json();
}

/**
 * Check backend health / readiness.
 */
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error("Backend health check failed");
  return res.json() as Promise<HealthResponse>;
}
