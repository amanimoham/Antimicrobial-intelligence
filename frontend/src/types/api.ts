export type DashboardSummary = {
  completionRate: number;
  currentBatch: string;
  riskLevel: string;
  sampleCount: number;
  predictionCount: number;
  riskUp: boolean;
};

export type ProgressPoint = { name: string; value: number };

export type PredictionRow = {
  id: number;
  sample_id: string;
  predicted_activity: number;
  predicted_mic: number;
  resistance_prediction: string;
  risk_level: string;
  created_at: string | null;
};

export type SampleRow = {
  id: number;
  sample_id: string;
  sample_type: string;
  collection_date: string;
  bacteria_name: string;
  batch_id: string;
  created_at: string | null;
};

export type CompoundRow = {
  id: number;
  compound_id: string;
  compound_name: string;
  predicted_activity_score: number;
  predicted_toxicity_score: number;
  novelty_score: number;
  created_at: string | null;
};

export type ParetoPoint = {
  x: number;
  y: number;
  group?: string;
  label?: string;
};

export type UploadResult = {
  message: string;
  rows_inserted: number;
  preview: Record<string, string>[];
};
