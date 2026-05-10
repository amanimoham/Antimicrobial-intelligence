"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParetoCard } from "@/components/ParetoCard";
import { ApiError, api } from "@/lib/api";
import { publishDataUpdated, subscribeDataUpdated } from "@/lib/data-refresh";
import type { CompoundRow, ParetoPoint } from "@/types/api";

export default function CompoundsPage() {
  const [rows, setRows] = useState<CompoundRow[]>([]);
  const [pareto, setPareto] = useState<ParetoPoint[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [comp, par] = await Promise.all([api.compounds(), api.pareto()]);
      setRows(comp);
      setPareto(par.points);
      setErr(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.body : String(e));
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
    setBusy(true);
    setErr(null);
    try {
      const res = await api.generateCandidates();
      setPareto(res.pareto);
      publishDataUpdated("candidates-generated");
    } catch (e) {
      setErr(e instanceof ApiError ? e.body : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Compounds</h2>
          <Button onClick={onGenerate} disabled={busy}>
            {busy ? "Generating…" : "Generate Candidates"}
          </Button>
        </div>
        {err && <p className="mt-3 text-sm text-red-700">{err}</p>}
        {loading ? (
          <p className="mt-4 text-sm text-neutral-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No compounds generated yet.</p>
        ) : (
          <div className="mt-4 overflow-auto rounded-2xl border border-border-soft">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Activity</th>
                  <th className="px-3 py-2">Toxicity</th>
                  <th className="px-3 py-2">Novelty</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border-soft">
                    <td className="px-3 py-2 font-mono text-xs">{r.compound_id}</td>
                    <td className="px-3 py-2">{r.compound_name}</td>
                    <td className="px-3 py-2">{r.predicted_activity_score}</td>
                    <td className="px-3 py-2">{r.predicted_toxicity_score}</td>
                    <td className="px-3 py-2">{r.novelty_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <ParetoCard points={pareto} />
      </div>
    </AppShell>
  );
}

