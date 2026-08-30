import type { ReactNode } from "react";
import { LeadPartnerShell } from "@/components/lead-partners/lead-partner-shell";

export default function LeadPartnerLayout({ children }: { children: ReactNode }) {
  return <LeadPartnerShell>{children}</LeadPartnerShell>;
}
