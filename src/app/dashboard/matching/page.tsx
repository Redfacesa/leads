import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MatchingPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Matching</h2>
          <p className="text-[#8c8c8c]">Rule-based lead routing (v0.2). v0.1 uses manual assignment on lead detail.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Planned rule example</CardTitle>
            <CardDescription>Automated matching ships in v0.2</CardDescription>
          </CardHeader>
          <CardContent className="font-mono text-sm text-[#bdbdbd] space-y-2">
            <p>IF category = debt_assistance</p>
            <p>AND province = Gauteng</p>
            <p>AND lead_score &gt;= 70</p>
            <p>THEN send to Partner A (priority 1)</p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
