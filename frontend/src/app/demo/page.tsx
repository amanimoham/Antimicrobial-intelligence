import { AppShell } from "@/components/layout/AppShell";
import { DashboardContent } from "@/components/DashboardContent";

export default function DemoPage() {
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";
  if (!demoEnabled) {
    return (
      <AppShell>
        <p className="mb-4 text-sm text-neutral-500">
          Demo mode is disabled. Set <code>NEXT_PUBLIC_ENABLE_DEMO=true</code> to enable this page.
        </p>
        <DashboardContent />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <p className="mb-4 text-sm text-neutral-500">
        Demo mode enabled by environment flag. Live API data remains the default source.
      </p>
      <DashboardContent />
    </AppShell>
  );
}
