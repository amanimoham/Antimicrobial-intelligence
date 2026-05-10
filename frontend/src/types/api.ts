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

export type PredictResponse = PredictionRow & {
  resistance_score?: number;
  model_source?: string;
  refresh_required?: boolean;
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

export type SamplesListResponse = {
  items: SampleRow[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
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
  replace_mode?: boolean;
  cleared?: {
    removed_ingestion_rows: number;
    removed_samples: number;
    removed_predictions: number;
    removed_compounds: number;
  };
  refresh_required?: boolean;
  totals?: { samples: number; ingestion_rows: number };
  parsing_summary?: {
    rows_in_file?: number;
    rows_inserted?: number;
    valid_rows?: number;
    invalid_rows?: number;
    ingestion_rows_inserted?: number;
  };
  upload_job?: {
    id: number;
    filename: string;
    status: string;
    row_count: number;
    valid_rows: number;
    invalid_rows: number;
    uploaded_at: string | null;
  };
};
