import Link from "next/link";
import { Activity, Database, Layers } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  { title: "Resistance Prediction", desc: "Rule-based inference with stored metrics.", icon: Activity },
  { title: "Compound Generation", desc: "Generate candidate rows and Pareto points.", icon: Layers },
  { title: "Data Management", desc: "CSV/XLSX uploads with validation.", icon: Database },
];

export default function LandingPage() {
  return (
    <AppShell>
      <div className="rounded-3xl border border-border-soft bg-white p-10 shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">Research Platform</p>
        <h2 className="mt-4 text-balance text-3xl font-bold text-neutral-900 sm:text-4xl">
          ANTIBACTERIAL GENERATION AND RESISTANCE PREDICTION PLATFORM
        </h2>
        <p className="mt-4 max-w-2xl text-neutral-600">
          A minimal, elegant red dashboard for ingestion, candidate generation, and resistance prediction — built for
          rapid iteration and future real ML.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button size="lg">Launch Dashboard</Button>
          </Link>
          <Link href="/demo">
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </Link>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary-muted p-2 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-neutral-900">{f.title}</h3>
            </div>
            <p className="mt-3 text-sm text-neutral-600">{f.desc}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
