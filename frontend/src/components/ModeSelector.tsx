"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const modes = ["Academic", "Research", "Industrial"] as const;

export function ModeSelector({ value = "Research" }: { value?: (typeof modes)[number] }) {
  return (
    <Card className="p-4">
      <CardTitle className="mb-3">Mode Selector</CardTitle>
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 ring-1 ring-border-soft">
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            className={cn(
              "rounded-xl py-3 text-center text-sm font-semibold transition",
              m === value ? "bg-primary-muted text-primary shadow-sm" : "text-neutral-500 hover:bg-neutral-50"
            )}
          >
            {m}
          </button>
        ))}
      </div>
    </Card>
  );
}
