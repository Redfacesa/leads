import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerPortalPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#262626] bg-[#111] px-4 py-4">
        <p className="text-lg font-semibold text-white">Partner Portal <span className="text-[#8c8c8c] text-sm font-normal">(v0.2)</span></p>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader><CardTitle>Coming in v0.2</CardTitle></CardHeader>
          <CardContent className="text-[#bdbdbd]">
            Partners will sign in here to view assigned leads, update status, and manage billing.
            v0.1 uses the admin dashboard for manual assignment.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
