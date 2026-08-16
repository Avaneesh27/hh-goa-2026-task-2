import { RAGResponse, HealthInfo } from "@/types/rag";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function sendTextQuery(
  query: string,
  language?: string,
  filterLanguage?: string
): Promise<RAGResponse> {
  const res = await fetch(`${API_BASE}/api/text/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      language: language || undefined,
      filter_language: filterLanguage || undefined,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Text query failed: ${res.statusText}`);
  }
  return res.json();
}

export async function sendVoiceQuery(
  audioBlob: Blob,
  language?: string,
  transcript?: string
): Promise<RAGResponse> {
  const formData = new FormData();
  formData.append("file", audioBlob, "voice_query.wav");
  if (language) {
    formData.append("language", language);
  }
  if (transcript) {
    formData.append("transcript", transcript);
  }

  const res = await fetch(`${API_BASE}/api/voice/query`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Voice query failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchMetrics(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/metrics`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Metrics fetch failed: ${res.statusText}`);
  }
  return res.json();
}
