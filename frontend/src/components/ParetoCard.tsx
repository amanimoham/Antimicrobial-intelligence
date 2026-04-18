"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import type { ParetoPoint } from "@/types/api";

export function ParetoCard({ points }: { points: ParetoPoint[] }) {
  const a = points.filter((p) => p.group === "A" || !p.group);
  const b = points.filter((p) => p.group === "B");
  const mx = points.length ? points.reduce((s, p) => s + p.x, 0) / points.length : 0.5;
  const my = points.length ? points.reduce((s, p) => s + p.y, 0) / points.length : 0.4;
  return (
    <Card>
      <CardTitle className="mb-2 normal-case tracking-normal text-base text-neutral-900">Pareto Optimization</CardTitle>
      <div className="h-56">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e4" />
            <XAxis type="number" dataKey="x" name="x" tick={{ fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name="y" tick={{ fontSize: 11 }} />
            <ZAxis range={[60, 60]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <ReferenceLine x={mx} stroke="#c41e3a" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine y={my} stroke="#c41e3a" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Scatter name="A" data={a.length ? a : points} fill="#e57373" />
            <Scatter name="B" data={b.length ? b : []} fill="#c41e3a" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-2xl bg-primary-muted/50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
        <span>High</span>
        <div className="h-2 flex-1 mx-3 rounded-full bg-gradient-to-r from-primary-muted via-primary to-primary-muted" />
        <span>Resistance</span>
      </div>
    </Card>
  );
}
