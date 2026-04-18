"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { StatsBadge } from "@/components/StatsBadge";
import type { DashboardSummary } from "@/types/api";

export function DashboardCard({ summary }: { summary: DashboardSummary }) {
  const pct = Math.min(100, Math.max(0, summary.completionRate));
  const data = [
    { name: "done", value: pct },
    { name: "rest", value: 100 - pct },
  ];
  return (
    <Card>
      <CardTitle className="mb-4">Dashboard</CardTitle>
      <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center md:justify-between">
        <div className="relative mx-auto h-44 w-44">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={54} outerRadius={72} strokeWidth={0}>
                <Cell fill="#c41e3a" />
                <Cell fill="#f5d6dc" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-primary">{Math.round(pct)}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-3 text-sm">
          <p className="font-semibold text-neutral-700">Completion Rate</p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Current Batch</p>
              <p className="text-lg font-bold text-neutral-900">{summary.currentBatch}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Risk Level</p>
              <StatsBadge label={summary.riskLevel} up={summary.riskUp} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
