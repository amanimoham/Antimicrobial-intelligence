"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function TableCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">{title}</h3>
      {children}
    </Card>
  );
}
