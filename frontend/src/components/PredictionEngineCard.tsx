"use client";

import { Card } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import type { PredictionRow } from "@/types/api";

export function PredictionEngineCard({ prediction }: { prediction: PredictionRow | null }) {
  const act = prediction?.predicted_activity ?? 8.5;
  const mic = prediction?.predicted_mic ?? 2.4;
  const res = prediction?.resistance_prediction ?? "Intermediate";
  return (
    <Card>
      <CardTitle className="mb-4">Prediction Engine</CardTitle>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Predicted Activity</p>
            <p className="text-xl font-bold text-primary">{act.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">MIC</p>
            <p className="text-lg font-semibold text-neutral-900">{mic.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Resistance Prediction</p>
            <p className="font-semibold text-neutral-800">{res}</p>
          </div>
        </div>
        <div className="flex h-28 w-28 items-center justify-center self-center rounded-full border-4 border-primary bg-white text-3xl font-bold text-primary shadow-card">
          {act.toFixed(1)}
        </div>
      </div>
    </Card>
  );
}
