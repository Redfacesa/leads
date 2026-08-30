import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface ActivityRow {
  action: string;
  entity_id: string | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

async function getRecentActivity(): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connect_audit_logs")
    .select("action, entity_id, new_data, created_at")
    .order("created_at", { ascending: false })
    .limit(12);
  return (data ?? []) as ActivityRow[];
}

function activityLabel(row: ActivityRow): string {
  const ref = row.new_data?.lead_reference ?? row.new_data?.partner_name;
  const suffix = ref ? `: ${ref}` : "";
  return row.action.replace(/\./g, " ") + suffix;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [stats, recent, activity] = await Promise.all([getStats(), getRecentLeads(), getRecentActivity()]);

  const cards = [
    { label: "Total leads", value: stats.total_leads, href: "/dashboard/leads" },
    { label: "New today", value: stats.new_today, href: "/dashboard/leads?status=new" },
    { label: "Qualified", value: stats.qualified, href: "/dashboard/leads?status=qualified" },
    { label: "Active partners", value: stats.partners, href: "/dashboard/partners" },
    { label: "Converted", value: stats.converted, href: "/dashboard/analytics" },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Overview</h2>
            <p className="text-[#8c8c8c]">Generate. Qualify. Connect. Grow.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/analytics">Analytics</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/revenue">Billing</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((c) => (
            <Link key={c.label} href={c.href}>
              <Card className="hover:border-[#404040] transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal text-[#8c8c8c]">{c.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{c.value}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
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
                    <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-[#1a1a1a] -mx-2 px-2 rounded">
                      <div>
                        <p className="font-medium text-white">{lead.lead_reference}</p>
                        <p className="text-sm text-[#8c8c8c]">
                          {(lead as ConnectLead & { connect_lead_categories?: { name: string } }).connect_lead_categories?.name ?? "Enquiry"}
                          {" · "}{lead.province}
                        </p>
                      </div>
                      <p className="text-sm text-[#8c8c8c]">{formatDate(lead.created_at)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-[#8c8c8c]">No activity yet</p>
              ) : (
                <div className="divide-y divide-[#262626]">
                  {activity.map((row, i) => (
                    <div key={i} className="py-2 text-sm">
                      <p className="text-white capitalize">{activityLabel(row)}</p>
                      <p className="text-xs text-[#8c8c8c]">{formatDate(row.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
