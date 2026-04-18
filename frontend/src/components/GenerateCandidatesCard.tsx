"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";

export function GenerateCandidatesCard({ onGenerate, busy }: { onGenerate: () => void; busy?: boolean }) {
  return (
    <Card>
      <CardTitle className="mb-4">Compound Generation</CardTitle>
      <Button size="lg" className="w-full" onClick={onGenerate} disabled={busy}>
        {busy ? "Generating…" : "Generate Candidates"}
      </Button>
    </Card>
  );
}
