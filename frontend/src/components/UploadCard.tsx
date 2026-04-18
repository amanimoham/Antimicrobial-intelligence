"use client";

import type { ReactNode } from "react";
import { Card, CardTitle } from "@/components/ui/card";

export function UploadCard({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardTitle className="mb-3">Upload dataset</CardTitle>
      {children}
    </Card>
  );
}
