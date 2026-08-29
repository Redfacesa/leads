import type { ReactNode } from "react";
import { SetupGate } from "@/components/setup/setup-notice";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <SetupGate>{children}</SetupGate>;
}
