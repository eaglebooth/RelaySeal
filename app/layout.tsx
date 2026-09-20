import type { Metadata } from "next";
import "./globals.css";
import "./validation.css";

export const metadata: Metadata = {
  title: "RelaySeal — Authority-bound handovers",
  description: "GenLayer-adjudicated operational handovers with explicit on-chain authority.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
