"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/AppShell";
import { UploadCard } from "@/components/UploadCard";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";

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
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    const file = values.file.item(0);
    if (!file) return;
    setStatus(null);
    setPreview(null);
    try {
      const res = await api.upload(file);
      setStatus(`Inserted ${res.rows_inserted} rows`);
      setPreview(res.preview ?? []);
    } catch (e) {
      setStatus(e instanceof ApiError ? e.body : String(e));
    }
  });

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
      </UploadCard>
    </AppShell>
  );
}
