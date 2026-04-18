"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
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

const demoPareto: ParetoPoint[] = [
  { x: 0.42, y: 0.55, group: "A", label: "d1" },
  { x: 0.48, y: 0.48, group: "A", label: "d2" },
  { x: 0.62, y: 0.36, group: "B", label: "d3" },
  { x: 0.71, y: 0.32, group: "B", label: "d4" },
  { x: 0.55, y: 0.44, group: "B", label: "d5" },
];

export function DashboardContent({ useStaticFallback = false }: { useStaticFallback?: boolean }) {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [progress, setProgress] = useState<ProgressPoint[]>(defaultProgress);
  const [pareto, setPareto] = useState<ParetoPoint[]>(useStaticFallback ? demoPareto : []);
  const [samples, setSamples] = useState<SampleRow[]>([]);
  const [latest, setLatest] = useState<PredictionRow | null>(() =>
    useStaticFallback
      ? {
          id: 0,
          sample_id: "SAMP123",
          predicted_activity: 8.5,
          predicted_mic: 2.4,
          resistance_prediction: "Intermediate",
          risk_level: "Moderate",
          created_at: null,
        }
      : null
  );
  const [loading, setLoading] = useState(!useStaticFallback);
  const [error, setError] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState(false);

  const load = useCallback(async () => {
    if (useStaticFallback) return;
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
      setSamples(samp);
      setLatest(preds[0] ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.body : String(e));
    } finally {
      setLoading(false);
    }
  }, [useStaticFallback]);

  useEffect(() => {
    void load();
  }, [load]);

  const onGenerate = async () => {
    if (useStaticFallback) {
      setPareto(demoPareto);
      return;
    }
    setGenBusy(true);
    try {
      const r = await api.generateCandidates();
      setPareto(r.pareto);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.body : String(e));
    } finally {
      setGenBusy(false);
    }
  };

  if (loading && !useStaticFallback) {
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
