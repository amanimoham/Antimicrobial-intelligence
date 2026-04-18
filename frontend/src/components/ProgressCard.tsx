"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import type { ProgressPoint } from "@/types/api";

export function ProgressCard({ points }: { points: ProgressPoint[] }) {
  const bar = points.length ? Math.min(100, Math.round((points[points.length - 1]?.value ?? 0) * 0.85)) : 70;
  return (
    <Card>
      <CardTitle className="mb-4">Progress</CardTitle>
      <div className="h-48 rounded-2xl bg-gradient-to-b from-primary-muted/60 to-white p-2">
        <ResponsiveContainer>
          <AreaChart data={points}>
            <defs>
              <linearGradient id="fillRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c41e3a" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#c41e3a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e4" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#737373" }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, "dataMax + 10"]} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#c41e3a" strokeWidth={2} fill="url(#fillRed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${bar}%` }} />
      </div>
    </Card>
  );
}
