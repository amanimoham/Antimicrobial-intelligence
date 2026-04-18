import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AppShell>
      <Card className="p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Settings</h2>
        <p className="mt-3 text-sm text-neutral-600">
          API base URL: <code className="rounded bg-neutral-100 px-2 py-1">NEXT_PUBLIC_API_URL</code> (default{" "}
          <code>http://127.0.0.1:8000</code>)
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          Theme tokens live in <code>tailwind.config.ts</code> and <code>globals.css</code>.
        </p>
      </Card>
    </AppShell>
  );
}
