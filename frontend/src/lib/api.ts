import type {
  CompoundRow,
  DashboardSummary,
  ParetoPoint,
  PredictionRow,
  PredictResponse,
  ProgressPoint,
  SampleRow,
  SamplesListResponse,
  UploadResult,
} from "@/types/api";

function resolveApiBase(): string {
  const envBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required in production. Set it to your Render backend URL (e.g. https://your-backend.onrender.com)."
    );
  }
  // Development fallback only; never derived from frontend production domain.
  return "http://127.0.0.1:8002";
}

const API = resolveApiBase();

function alternateApiBase(primary: string): string | null {
  try {
    const u = new URL(primary);
    const local = u.hostname === "127.0.0.1" || u.hostname === "localhost";
    if (!local) return null;
    if (u.hostname === "127.0.0.1") {
      u.hostname = "localhost";
      return u.toString().replace(/\/+$/, "");
    }
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
      return u.toString().replace(/\/+$/, "");
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchWithApiFallback(path: string, init?: RequestInit): Promise<Response> {
  const primaryUrl = `${API}${path}`;
  try {
    return await fetch(primaryUrl, init);
  } catch (primaryErr) {
    const alt = alternateApiBase(API);
    if (!alt) {
      throw new ApiError(
        0,
        `Network error while calling ${primaryUrl}. Verify backend is running and NEXT_PUBLIC_API_URL is correct. Original: ${String(primaryErr)}`
      );
    }
    const altUrl = `${alt}${path}`;
    try {
      return await fetch(altUrl, init);
    } catch (altErr) {
      throw new ApiError(
        0,
        `Network error while calling ${primaryUrl} (also tried ${altUrl}). Verify backend is running on port 8002 and CORS allows your frontend origin. Original: ${String(
          altErr
        )}`
      );
    }
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`API ${status}: ${body}`);
  }
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithApiFallback(path, { ...init, cache: "no-store" });
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
  samples: (page = 1, pageSize = 50) =>
    json<SamplesListResponse>(`/api/samples?page=${page}&page_size=${pageSize}`),
  updateSample: (
    id: number,
    payload: Pick<SampleRow, "sample_type" | "collection_date" | "bacteria_name" | "batch_id">
  ) =>
    json<{ message: string; item: SampleRow; refresh_required?: boolean }>(`/api/samples/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteSample: (id: number) =>
    json<{ message: string; id: number; refresh_required?: boolean }>(`/api/samples/${id}`, {
      method: "DELETE",
    }),
  compounds: () => json<CompoundRow[]>("/api/compounds"),
  upload: async (file: File): Promise<UploadResult> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetchWithApiFallback("/api/uploads/data", { method: "POST", body: fd });
    const text = await res.text();
    if (!res.ok) throw new ApiError(res.status, text);
    return JSON.parse(text) as UploadResult;
  },
  generateCandidates: (payload?: { sample_id?: string; pathogen?: string }) =>
    json<{
      created: number;
      compounds: number;
      pareto: ParetoPoint[];
      used_sample_id?: string | null;
      refresh_required?: boolean;
    }>("/api/generate/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    }),
  predict: (sample_id: string, bacteria_name?: string) =>
    json<PredictResponse>("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample_id, bacteria_name }),
    }),
};
