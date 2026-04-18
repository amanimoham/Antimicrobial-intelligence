import { FlaskConical } from "lucide-react";

export function Header() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
          <FlaskConical className="h-6 w-6" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary/80">Platform</p>
          <p className="text-xs text-neutral-500">Antimicrobial intelligence</p>
        </div>
      </div>
      <h1 className="max-w-3xl text-right text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-primary sm:text-xs md:text-sm">
        ANTIBACTERIAL GENERATION AND RESISTANCE PREDICTION PLATFORM
      </h1>
    </div>
  );
}
