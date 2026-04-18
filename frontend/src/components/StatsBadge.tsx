import { Triangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsBadge({ label, up }: { label: string; up?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
      <span>{label}</span>
      <Triangle
        className={cn("h-3 w-3 fill-primary text-primary", !up && "rotate-180 opacity-40")}
        aria-hidden
      />
    </div>
  );
}
