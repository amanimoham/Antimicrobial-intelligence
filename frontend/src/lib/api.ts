import type {
  CompoundRow,
  DashboardSummary,
  ParetoPoint,
  PredictionRow,
  ProgressPoint,
  SampleRow,
  UploadResult,
} from "@/types/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8002";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`API ${status}: ${body}`);
  }
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new ApiError(res.status, text);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export const api = {
  health: () => json<{ status: string }>("/api/health"),
  summary: () => json<DashboardSummary>("/api/dashboard/summary"),
  progress: () => json<{ points: ProgressPoint[] }>("/api/dashboard/progress"),
  pareto: () => json<{ points: ParetoPoint[] }>("/api/dashboard/pareto"),
  predictions: () => json<PredictionRow[]>("/api/predictions"),
  samples: () => json<SampleRow[]>("/api/samples"),
  compounds: () => json<CompoundRow[]>("/api/compounds"),
  upload: async (file: File): Promise<UploadResult> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/api/uploads/data`, { method: "POST", body: fd });
    const text = await res.text();
    if (!res.ok) throw new ApiError(res.status, text);
    return JSON.parse(text) as UploadResult;
  },
  generateCandidates: () =>
    json<{ created: number; compounds: number; pareto: ParetoPoint[] }>("/api/generate/candidates", {
      method: "POST",
    }),
  predict: (sample_id: string, bacteria_name?: string) =>
    json<PredictionRow>("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample_id, bacteria_name }),
    }),
};
