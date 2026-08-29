import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-[#8c8c8c]">Funnel and conversion analytics ship in v0.2</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Lead funnel (planned)</CardTitle></CardHeader>
          <CardContent className="text-[#bdbdbd] text-sm space-y-1">
            <p>Total enquiries</p>
            <p>Verified</p>
            <p>Qualified</p>
            <p>Delivered</p>
            <p>Contacted</p>
            <p>Converted</p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
