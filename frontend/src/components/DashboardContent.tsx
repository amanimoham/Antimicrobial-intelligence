"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { subscribeDataUpdated, publishDataUpdated } from "@/lib/data-refresh";
import { DashboardCard } from "@/components/DashboardCard";
import { DataManagementSection } from "@/components/DataManagementSection";
import { GenerateCandidatesCard } from "@/components/GenerateCandidatesCard";
import { ModeSelector } from "@/components/ModeSelector";
import { ParetoCard } from "@/components/ParetoCard";
import { PredictionEngineCard } from "@/components/PredictionEngineCard";
import { ProgressCard } from "@/components/ProgressCard";
import { VirtualLabCard } from "@/components/VirtualLabCard";
import type { DashboardSummary, ParetoPoint, PredictionRow, ProgressPoint, SampleRow } from "@/types/api";

const defaultSummary: DashboardSummary = {
  completionRate: 70,
  currentBatch: "4",
  riskLevel: "Moderate",
  sampleCount: 0,
  predictionCount: 0,
  riskUp: true,
};

const defaultProgress: ProgressPoint[] = [
  { name: "Mon", value: 12 },
  { name: "Tue", value: 22 },
  { name: "Wed", value: 34 },
  { name: "Thu", value: 46 },
  { name: "Fri", value: 58 },
  { name: "Sat", value: 66 },
  { name: "Sun", value: 72 },
];

export function DashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [progress, setProgress] = useState<ProgressPoint[]>(defaultProgress);
  const [pareto, setPareto] = useState<ParetoPoint[]>([]);
  const [samples, setSamples] = useState<SampleRow[]>([]);
  const [latest, setLatest] = useState<PredictionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p, pr, samp, preds] = await Promise.all([
        api.summary(),
        api.progress(),
        api.pareto(),
        api.samples(),
        api.predictions(),
      ]);
      setSummary(s);
      setProgress(p.points);
      setPareto(pr.points);
      setSamples(samp.items);
      setLatest(preds[0] ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.body : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribeDataUpdated(() => {
      void load();
    });
  }, [load]);

  const onGenerate = async () => {
    setGenBusy(true);
    setError(null);
    try {
      const r = await api.generateCandidates();
      setPareto(r.pareto);
      if (r.refresh_required) {
        publishDataUpdated("candidates-generated");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.body : String(e));
    } finally {
      setGenBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading dashboard…</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <ModeSelector />
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard summary={summary} />
        <ProgressCard points={progress} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <DataManagementSection samples={samples} />
        <div className="space-y-6">
          <GenerateCandidatesCard onGenerate={onGenerate} busy={genBusy} />
          <PredictionEngineCard prediction={latest} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ParetoCard points={pareto} />
        <VirtualLabCard />
      </div>
    </div>
  );
}
