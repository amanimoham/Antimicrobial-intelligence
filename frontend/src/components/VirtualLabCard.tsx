"use client";

import { Card } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";

export function VirtualLabCard() {
  return (
    <Card>
      <CardTitle className="mb-4">Virtual Lab</CardTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border-soft bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Experiment status</p>
          <p className="mt-1 text-lg font-bold text-primary">Ready</p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Assay readiness</p>
          <p className="mt-1 text-lg font-bold text-neutral-900">92%</p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Run state</p>
          <p className="mt-1 text-lg font-bold text-neutral-900">Idle</p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Throughput</p>
          <p className="mt-1 text-lg font-bold text-neutral-900">120 / day</p>
        </div>
      </div>
    </Card>
  );
}
