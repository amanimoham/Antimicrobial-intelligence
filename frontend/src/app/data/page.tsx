"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/AppShell";
import { UploadCard } from "@/components/UploadCard";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { publishDataUpdated } from "@/lib/data-refresh";
import { Card } from "@/components/ui/card";
import { PredictionEngineCard } from "@/components/PredictionEngineCard";
import { ParetoCard } from "@/components/ParetoCard";
import type { CompoundRow, ParetoPoint, PredictResponse, SampleRow } from "@/types/api";

const BACTERIA_CANONICAL = [
  "Escherichia coli",
  "Klebsiella pneumoniae",
  "Pseudomonas aeruginosa",
  "Staphylococcus aureus",
  "Enterococcus faecalis",
  "Acinetobacter baumannii",
  "Proteus mirabilis",
] as const;

const BACTERIA_ALIAS_MAP: Record<string, string> = {
  "escherichia coli": "Escherichia coli",
  "e. coli": "Escherichia coli",
  "e coli": "Escherichia coli",
  ecoli: "Escherichia coli",
  "klebsiella pneumoniae": "Klebsiella pneumoniae",
  klebsiella: "Klebsiella pneumoniae",
  "pseudomonas aeruginosa": "Pseudomonas aeruginosa",
  pseudomonas: "Pseudomonas aeruginosa",
  "staphylococcus aureus": "Staphylococcus aureus",
  "staph aureus": "Staphylococcus aureus",
  "s. aureus": "Staphylococcus aureus",
  "enterococcus faecalis": "Enterococcus faecalis",
  "acinetobacter baumannii": "Acinetobacter baumannii",
  acinetobacter: "Acinetobacter baumannii",
  "proteus mirabilis": "Proteus mirabilis",
  proteus: "Proteus mirabilis",
};

function normalizeBacteriaName(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (!key) return "";
  return BACTERIA_ALIAS_MAP[key] ?? raw.trim();
}

const schema = z.object({
  file: z
    .custom<FileList>((v) => v instanceof FileList && v.length > 0, "Choose a CSV or XLSX file")
    .refine((f) => {
      const file = f.item(0);
      if (!file) return false;
      const n = file.name.toLowerCase();
      return n.endsWith(".csv") || n.endsWith(".xlsx");
    }, "File must be .csv or .xlsx"),
});

type FormValues = z.infer<typeof schema>;

export default function DataPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [samples, setSamples] = useState<SampleRow[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Pick<
    SampleRow,
    "sample_type" | "collection_date" | "bacteria_name" | "batch_id"
  > | null>(null);
  const [rowBusyId, setRowBusyId] = useState<number | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<number | null>(null);
  const [predictBacteriaOverride, setPredictBacteriaOverride] = useState("");
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictResponse | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [compounds, setCompounds] = useState<CompoundRow[]>([]);
  const [pareto, setPareto] = useState<ParetoPoint[]>([]);
  const [loadingCompounds, setLoadingCompounds] = useState(true);
  const [generatingCompounds, setGeneratingCompounds] = useState(false);
  const [compoundsError, setCompoundsError] = useState<string | null>(null);
  const PAGE_SIZE = 20;
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const loadSamples = useCallback(async (targetPage = 1) => {
    setLoadingSamples(true);
    try {
      const response = await api.samples(targetPage, PAGE_SIZE);
      setSamples(response.items);
      setPage(response.pagination.page);
      setTotalPages(response.pagination.total_pages);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.body : String(e));
    } finally {
      setLoadingSamples(false);
    }
  }, []);

  useEffect(() => {
    void loadSamples(page);
  }, [loadSamples, page]);

  const loadCompounds = useCallback(async () => {
    setLoadingCompounds(true);
    try {
      const [comp, par] = await Promise.all([api.compounds(), api.pareto()]);
      setCompounds(comp);
      setPareto(par.points);
      setCompoundsError(null);
    } catch (e) {
      setCompoundsError(e instanceof ApiError ? e.body : String(e));
    } finally {
      setLoadingCompounds(false);
    }
  }, []);

  useEffect(() => {
    void loadCompounds();
  }, [loadCompounds]);

  const selectedRow = samples.find((s) => s.id === selectedSampleId) ?? null;

  useEffect(() => {
    // Reset dependent state when active record changes.
    setPredictionResult(null);
    setPredictionError(null);
  }, [selectedSampleId]);

  const onSubmit = handleSubmit(async (values) => {
    const file = values.file.item(0);
    if (!file) return;
    setStatus(null);
    setError(null);
    setPreview(null);
    try {
      const res = await api.upload(file);
      setStatus(
        `Dataset replaced successfully: ${res.parsing_summary?.valid_rows ?? res.rows_inserted} valid rows, ${
          res.parsing_summary?.invalid_rows ?? 0
        } invalid rows. Removed old samples: ${res.cleared?.removed_samples ?? 0}.`
      );
      setPreview(res.preview ?? []);
      setSelectedSampleId(null);
      setPredictBacteriaOverride("");
      setPredictionResult(null);
      await loadSamples(1);
      await loadCompounds();
      if (res.refresh_required) {
        publishDataUpdated("upload");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.body : String(e));
    }
  });

  const startEdit = (row: SampleRow) => {
    setEditingId(row.id);
    setEditDraft({
      sample_type: row.sample_type,
      collection_date: row.collection_date,
      bacteria_name: row.bacteria_name,
      batch_id: row.batch_id,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async (id: number) => {
    if (!editDraft) return;
    setRowBusyId(id);
    setError(null);
    try {
      const res = await api.updateSample(id, editDraft);
      setStatus(`Sample ${res.item.sample_id} updated successfully.`);
      cancelEdit();
      await loadSamples(page);
      if (selectedSampleId === id) {
        setPredictBacteriaOverride(res.item.bacteria_name);
      }
      if (res.refresh_required) {
        publishDataUpdated("sample-updated");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.body : String(e));
    } finally {
      setRowBusyId(null);
    }
  };

  const deleteRow = async (row: SampleRow) => {
    const ok = window.confirm(`Are you sure you want to delete record ${row.sample_id}?`);
    if (!ok) return;
    setRowBusyId(row.id);
    setError(null);
    try {
      const res = await api.deleteSample(row.id);
      setStatus(`Sample ${row.sample_id} deleted.`);
      if (selectedSampleId === row.id) {
        setSelectedSampleId(null);
        setPredictBacteriaOverride("");
        setPredictionResult(null);
      }
      if (samples.length === 1 && page > 1) {
        await loadSamples(page - 1);
      } else {
        await loadSamples(page);
      }
      if (res.refresh_required) {
        publishDataUpdated("sample-deleted");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.body : String(e));
    } finally {
      setRowBusyId(null);
    }
  };

  const runPrediction = async () => {
    if (!selectedRow) {
      setPredictionError("Select a persisted row first.");
      return;
    }
    setPredicting(true);
    setPredictionError(null);
    setPredictionResult(null);
    try {
      const normalizedOverride = normalizeBacteriaName(predictBacteriaOverride || selectedRow.bacteria_name);
      const result = await api.predict(selectedRow.sample_id, normalizedOverride);
      setPredictionResult(result);
      setStatus(`Prediction completed for ${selectedRow.sample_id}.`);
      if (result.refresh_required) {
        publishDataUpdated("prediction");
      }
    } catch (e) {
      setPredictionError(e instanceof ApiError ? e.body : String(e));
    } finally {
      setPredicting(false);
    }
  };

  const generateCompounds = async () => {
    setGeneratingCompounds(true);
    setCompoundsError(null);
    try {
      const res = await api.generateCandidates({
        sample_id: selectedRow?.sample_id,
        pathogen: (predictBacteriaOverride || selectedRow?.bacteria_name || "").trim() || undefined,
      });
      setPareto(res.pareto);
      await loadCompounds();
      setStatus(
        selectedRow
          ? `Generated compounds using selected sample ${selectedRow.sample_id}.`
          : "Generated compounds using current dataset context."
      );
      if (res.refresh_required) {
        publishDataUpdated("candidates-generated");
      }
    } catch (e) {
      setCompoundsError(e instanceof ApiError ? e.body : String(e));
    } finally {
      setGeneratingCompounds(false);
    }
  };

  return (
    <AppShell>
      <UploadCard>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="file" accept=".csv,.xlsx" {...register("file")} />
          {formState.errors.file && (
            <p className="text-sm text-red-600">{String(formState.errors.file.message)}</p>
          )}
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Uploading…" : "Upload & validate"}
          </Button>
        </form>
        {status && <p className="mt-3 text-sm text-neutral-700">{status}</p>}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        {preview && preview.length > 0 && (
          <div className="mt-4 overflow-auto rounded-2xl border border-border-soft">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500">
                  {Object.keys(preview[0]).map((k) => (
                    <th key={k} className="px-2 py-2">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-border-soft">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-2 py-2">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-6 overflow-auto rounded-2xl border border-border-soft">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500">
                <th className="px-2 py-2">Sample ID</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Collection Date</th>
                <th className="px-2 py-2">Bacteria</th>
                <th className="px-2 py-2">Batch/Source</th>
                <th className="px-2 py-2">Select</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingSamples ? (
                <tr>
                  <td colSpan={7} className="px-2 py-3 text-neutral-500">
                    Loading persisted samples...
                  </td>
                </tr>
              ) : samples.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-3 text-neutral-500">
                    No persisted samples yet. Upload a CSV/XLSX to populate the database.
                  </td>
                </tr>
              ) : (
                samples.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t border-border-soft ${selectedSampleId === row.id ? "bg-primary-muted/20" : ""}`}
                  >
                    <td className="px-2 py-2 font-mono">{row.sample_id}</td>
                    <td className="px-2 py-2">
                      {editingId === row.id ? (
                        <input
                          className="w-full rounded-lg border border-border-soft px-2 py-1"
                          value={editDraft?.sample_type ?? ""}
                          onChange={(e) => setEditDraft((prev) => ({ ...(prev ?? row), sample_type: e.target.value }))}
                        />
                      ) : (
                        row.sample_type
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {editingId === row.id ? (
                        <input
                          className="w-full rounded-lg border border-border-soft px-2 py-1"
                          value={editDraft?.collection_date ?? ""}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...(prev ?? row), collection_date: e.target.value }))
                          }
                        />
                      ) : (
                        row.collection_date
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {editingId === row.id ? (
                        <input
                          className="w-full rounded-lg border border-border-soft px-2 py-1"
                          value={editDraft?.bacteria_name ?? ""}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...(prev ?? row), bacteria_name: e.target.value }))
                          }
                        />
                      ) : (
                        row.bacteria_name
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {editingId === row.id ? (
                        <input
                          className="w-full rounded-lg border border-border-soft px-2 py-1"
                          value={editDraft?.batch_id ?? ""}
                          onChange={(e) => setEditDraft((prev) => ({ ...(prev ?? row), batch_id: e.target.value }))}
                        />
                      ) : (
                        row.batch_id
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        size="sm"
                        variant={selectedSampleId === row.id ? "default" : "outline"}
                        onClick={() => {
                          setSelectedSampleId(row.id);
                          setPredictBacteriaOverride(row.bacteria_name);
                        }}
                        type="button"
                      >
                        {selectedSampleId === row.id ? "Active" : "Select"}
                      </Button>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        {editingId === row.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => void saveEdit(row.id)}
                              disabled={rowBusyId === row.id}
                              type="button"
                            >
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} type="button">
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEdit(row)} type="button">
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void deleteRow(row)}
                              disabled={rowBusyId === row.id}
                              type="button"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
          <span>
            Page {page} / {Math.max(totalPages, 1)}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || loadingSamples}
              onClick={() => void loadSamples(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages || loadingSamples || totalPages === 0}
              onClick={() => void loadSamples(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>

        <Card className="mt-8 p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Prediction Section</h3>
          <p className="mt-2 text-xs text-neutral-500">
            Active sample: {selectedRow ? `${selectedRow.sample_id} (${selectedRow.sample_type})` : "None selected"}
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">Bacteria Override</label>
              <input
                className="rounded-xl border border-border-soft px-3 py-2 text-sm"
                placeholder="Type to search bacteria..."
                value={predictBacteriaOverride}
                onChange={(e) => setPredictBacteriaOverride(e.target.value)}
                list="bacteria-suggestions"
              />
              <datalist id="bacteria-suggestions">
                {BACTERIA_CANONICAL.map((name) => (
                  <option key={name} value={name} />
                ))}
                <option value="E. coli" />
                <option value="Klebsiella" />
                <option value="Pseudomonas" />
                <option value="Staph aureus" />
                <option value="Acinetobacter" />
                <option value="Proteus" />
              </datalist>
              <p className="mt-1 text-[11px] text-neutral-500">
                Supports aliases (e.g. E. coli, Klebsiella, Pseudomonas, Staph aureus) and auto-normalizes on predict.
              </p>
            </div>
            <Button type="button" onClick={() => void runPrediction()} disabled={predicting || !selectedRow}>
              {predicting ? "Running..." : "Run prediction on selected row"}
            </Button>
          </div>
          {predictionError ? <p className="mt-3 text-sm text-red-700">{predictionError}</p> : null}
          <div className="mt-4">
            <PredictionEngineCard prediction={predictionResult} />
          </div>
        </Card>

        <Card className="mt-8 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Compound Generation Section</h3>
            <Button type="button" onClick={() => void generateCompounds()} disabled={generatingCompounds}>
              {generatingCompounds ? "Generating..." : "Generate compounds from active context"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Context:{" "}
            {selectedRow ? `selected sample ${selectedRow.sample_id}` : "dataset-level context (no specific sample selected)"}
          </p>
          {compoundsError ? <p className="mt-3 text-sm text-red-700">{compoundsError}</p> : null}
          {loadingCompounds ? (
            <p className="mt-4 text-sm text-neutral-500">Loading compounds...</p>
          ) : compounds.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No compounds generated yet.</p>
          ) : (
            <div className="mt-4 overflow-auto rounded-2xl border border-border-soft">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-2 py-2">Compound ID</th>
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Activity</th>
                    <th className="px-2 py-2">Toxicity</th>
                    <th className="px-2 py-2">Novelty</th>
                  </tr>
                </thead>
                <tbody>
                  {compounds.map((c) => (
                    <tr key={c.id} className="border-t border-border-soft">
                      <td className="px-2 py-2 font-mono">{c.compound_id}</td>
                      <td className="px-2 py-2">{c.compound_name}</td>
                      <td className="px-2 py-2">{c.predicted_activity_score}</td>
                      <td className="px-2 py-2">{c.predicted_toxicity_score}</td>
                      <td className="px-2 py-2">{c.novelty_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-5">
            <ParetoCard points={pareto} />
          </div>
        </Card>
      </UploadCard>
    </AppShell>
  );
}
