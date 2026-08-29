import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { ConnectLead, DashboardStats } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("connect_dashboard_stats");
  const fallback: DashboardStats = { total_leads: 0, new_today: 0, qualified: 0, partners: 0, converted: 0 };
  if (!data || typeof data !== "object") return fallback;
  const row = data as Record<string, unknown>;
  return {
    total_leads: Number(row.total_leads ?? 0),
    new_today: Number(row.new_today ?? 0),
    qualified: Number(row.qualified ?? 0),
    partners: Number(row.partners ?? 0),
    converted: Number(row.converted ?? 0),
  };
}

async function getRecentLeads(): Promise<ConnectLead[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connect_leads")
    .select("*, connect_lead_categories(name, slug)")
    .order("created_at", { ascending: false })
    .limit(8);
  return (data ?? []) as ConnectLead[];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stats = await getStats();
  const recent = await getRecentLeads();

  const cards = [
    { label: "Total leads", value: stats.total_leads },
    { label: "New today", value: stats.new_today },
    { label: "Qualified", value: stats.qualified },
    { label: "Active partners", value: stats.partners },
    { label: "Converted", value: stats.converted },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Overview</h2>
          <p className="text-[#8c8c8c]">Generate. Qualify. Connect. Grow.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-[#8c8c8c]">{c.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent leads</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-[#8c8c8c]">No leads yet. Share the public form to start collecting enquiries.</p>
            ) : (
              <div className="divide-y divide-[#262626]">
                {recent.map((lead) => (
                  <div key={lead.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white">{lead.lead_reference}</p>
                      <p className="text-sm text-[#8c8c8c]">
                        {(lead as ConnectLead & { connect_lead_categories?: { name: string } }).connect_lead_categories?.name ?? "Enquiry"}
                        {" · "}{lead.province}
                      </p>
                    </div>
                    <p className="text-sm text-[#8c8c8c]">{formatDate(lead.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
