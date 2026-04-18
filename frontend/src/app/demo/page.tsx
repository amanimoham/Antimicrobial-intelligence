import { AppShell } from "@/components/layout/AppShell";
import { DashboardContent } from "@/components/DashboardContent";

export default function DemoPage() {
  return (
    <AppShell>
      <p className="mb-4 text-sm text-neutral-500">
        Static demo layout (red concept). Connect the API to mirror live data.
      </p>
      <DashboardContent useStaticFallback />
    </AppShell>
  );
}
