import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CampaignsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Campaigns</h2>
          <p className="text-[#8c8c8c]">Track acquisition sources and campaign performance</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Coming in v0.2</CardTitle></CardHeader>
          <CardContent className="text-[#8c8c8c]">
            Connect UTM parameters on the public form are already captured on each lead. Campaign management UI ships next.
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
