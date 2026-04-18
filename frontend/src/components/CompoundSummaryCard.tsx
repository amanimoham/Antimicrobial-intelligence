"use client";

import { Beaker } from "lucide-react";

export function CompoundSummaryCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-soft bg-neutral-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white p-2 text-primary shadow-sm">
          <Beaker className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900">Compumunde</p>
          <p className="text-xs text-neutral-500">Lead candidate · screened</p>
          <p className="text-xs text-neutral-400">Novelty-weighted rank</p>
        </div>
      </div>
    </div>
  );
}
