"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, api } from "@/lib/api";
import type { PredictionRow } from "@/types/api";

const predictSchema = z.object({
  sample_id: z.string().min(1, "Required"),
  bacteria_name: z.string().optional(),
});

type PredictForm = z.infer<typeof predictSchema>;

export default function PredictionsPage() {
  const [rows, setRows] = useState<PredictionRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState } = useForm<PredictForm>({
    resolver: zodResolver(predictSchema),
    defaultValues: { sample_id: "SAMP123" },
  });

  const load = async () => {
    setLoading(true);
    try {
      setRows(await api.predictions());
      setErr(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.body : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onPredict = handleSubmit(async (values) => {
    try {
      await api.predict(values.sample_id, values.bacteria_name || undefined);
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.body : String(e));
    }
  });

  return (
    <AppShell>
      <Card className="p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Predictions</h2>
        <form className="mt-4 flex flex-wrap gap-4" onSubmit={onPredict}>
          <input
            className="rounded-xl border border-border-soft px-3 py-2 text-sm"
            placeholder="sample_id"
            {...register("sample_id")}
          />
          <input
            className="rounded-xl border border-border-soft px-3 py-2 text-sm"
            placeholder="bacteria (optional)"
            {...register("bacteria_name")}
          />
          <Button type="submit" disabled={formState.isSubmitting}>
            Run prediction
          </Button>
        </form>
        {formState.errors.sample_id && (
          <p className="mt-2 text-sm text-red-600">{formState.errors.sample_id.message}</p>
        )}
        {err && <p className="mt-3 text-sm text-red-700">{err}</p>}
        {loading ? (
          <p className="mt-4 text-sm text-neutral-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No predictions yet.</p>
        ) : (
          <div className="mt-4 overflow-auto rounded-2xl border border-border-soft">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Sample</th>
                  <th className="px-3 py-2">Activity</th>
                  <th className="px-3 py-2">MIC</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border-soft">
                    <td className="px-3 py-2 font-mono text-xs">{r.sample_id}</td>
                    <td className="px-3 py-2">{r.predicted_activity}</td>
                    <td className="px-3 py-2">{r.predicted_mic}</td>
                    <td className="px-3 py-2">{r.resistance_prediction}</td>
                    <td className="px-3 py-2">{r.risk_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
