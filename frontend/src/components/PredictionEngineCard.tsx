"use client";

import { Card } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import type { PredictResponse, PredictionRow } from "@/types/api";

type PredictionCardModel = PredictionRow | PredictResponse;

export function PredictionEngineCard({ prediction }: { prediction: PredictionCardModel | null }) {
  const act = prediction?.predicted_activity;
  const mic = prediction?.predicted_mic;
  const res = prediction?.resistance_prediction;
  const risk = prediction?.risk_level;
  const predictionMeta = (prediction ?? {}) as Partial<PredictResponse>;
  const resistanceScore = predictionMeta.resistance_score;
  const modelSource = predictionMeta.model_source;
  const updatedAt = prediction?.created_at ? new Date(prediction.created_at).toLocaleString() : null;
  return (
    <Card>
      <CardTitle className="mb-4">Prediction Engine</CardTitle>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
        <span className="rounded-full border border-border-soft bg-neutral-50 px-2 py-1">Live</span>
        {modelSource ? (
          <span className="rounded-full border border-border-soft bg-primary-muted px-2 py-1 text-primary">
            {modelSource}
          </span>
        ) : null}
        {updatedAt ? <span className="rounded-full border border-border-soft bg-neutral-50 px-2 py-1">{updatedAt}</span> : null}
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Predicted Activity</p>
            <p className="text-xl font-bold text-primary">{act != null ? act.toFixed(1) : "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">MIC</p>
            <p className="text-lg font-semibold text-neutral-900">{mic != null ? mic.toFixed(1) : "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Resistance Prediction</p>
            <p className="font-semibold text-neutral-800">{res ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Risk Level</p>
            <p className="font-semibold text-neutral-800">{risk ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Resistance Score</p>
            <p className="font-semibold text-neutral-800">
              {typeof resistanceScore === "number" ? resistanceScore.toFixed(3) : "—"}
            </p>
          </div>
        </div>
        <div className="flex h-28 w-28 items-center justify-center self-center rounded-full border-4 border-primary bg-white text-3xl font-bold text-primary shadow-card">
          {act != null ? act.toFixed(1) : "—"}
        </div>
      </div>
    </Card>
  );
}
