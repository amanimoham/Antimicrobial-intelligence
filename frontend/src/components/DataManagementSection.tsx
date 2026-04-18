"use client";

import Link from "next/link";
import { CompoundSummaryCard } from "@/components/CompoundSummaryCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import type { SampleRow } from "@/types/api";

export function DataManagementSection({ samples }: { samples: SampleRow[] }) {
  const rows =
    samples.length > 0
      ? samples.slice(0, 3).map((s) => ({
          id: s.sample_id,
          date: s.collection_date,
          value: s.batch_id,
        }))
      : [
          { id: "SAMP123", date: "01/02/24", value: "6" },
          { id: "123456789", date: "01/02/24", value: "6" },
        ];
  return (
    <Card>
      <CardTitle className="mb-4">Data Management</CardTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {["Blood", "Urine", "Sputum"].map((t) => (
          <span
            key={t}
            className="rounded-full bg-primary-muted px-4 py-2 text-xs font-semibold text-primary"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mb-4">
        <CompoundSummaryCard />
      </div>
      <Link href="/data">
        <Button size="lg" className="w-full sm:w-auto">
          Load New Data
        </Button>
      </Link>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border-soft">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Sample</th>
              <th className="px-3 py-2 font-semibold">Date</th>
              <th className="px-3 py-2 font-semibold">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft bg-white">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 font-mono text-[11px]">{r.id}</td>
                <td className="px-3 py-2">{r.date}</td>
                <td className="px-3 py-2">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
