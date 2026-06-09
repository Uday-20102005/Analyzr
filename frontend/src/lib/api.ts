import type {
  UploadResponse,
  AnalysisResponse,
  VisualizationsResponse,
  ChatResponse,
  ChatRequest,
  PlaygroundRequest,
  PlaygroundResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || '';

function apiUrl(path: string): string {
  return `${API_BASE}/api${path}`;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return apiPost<UploadResponse>('/upload', form);
}

export async function runAnalysis(sessionId: string): Promise<AnalysisResponse> {
  return apiPost<AnalysisResponse>(`/analysis/${sessionId}`);
}

export async function fetchVisualizations(sessionId: string): Promise<VisualizationsResponse> {
  return apiGet<VisualizationsResponse>(`/visualizations/${sessionId}`);
}

export async function fetchChatOpener(sessionId: string): Promise<{ message: string }> {
  return apiGet<{ message: string }>(`/analysis/${sessionId}/opener`);
}

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  return apiPost<ChatResponse>('/chat', req);
}

export function buildReportUrl(sessionId: string, format: string): string {
  return `${apiUrl(`/report/${sessionId}`)}?format=${format}`;
}

export async function runPlayground(req: PlaygroundRequest): Promise<PlaygroundResponse> {
  return apiPost<PlaygroundResponse>('/playground', req);
}
