import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Antibacterial Generation and Resistance Prediction Platform",
  description: "Red-themed scientific dashboard for resistance prediction",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
