"use client";

import { Header } from "@/components/layout/Header";
import { TopNav } from "@/components/layout/TopNav";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Header />
        <div className="mt-6">
          <TopNav />
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
