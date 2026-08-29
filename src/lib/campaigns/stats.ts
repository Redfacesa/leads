import type { SupabaseClient } from "@supabase/supabase-js";

export interface CampaignLeadStats {
  total: number;
  qualified: number;
  delivered: number;
  converted: number;
}

const QUALIFIED_STATUSES = new Set([
  "qualified",
  "matched",
  "delivered",
  "contacted",
  "in_progress",
  "converted",
]);

export async function getCampaignLeadStats(
  admin: SupabaseClient
): Promise<Map<string | "unattributed", CampaignLeadStats>> {
  const { data: leads } = await admin
    .from("connect_leads")
    .select("campaign_id, status, utm_source, utm_medium, utm_campaign");

  const stats = new Map<string | "unattributed", CampaignLeadStats>();

  for (const lead of leads ?? []) {
    const key = lead.campaign_id ?? "unattributed";
    const row = stats.get(key) ?? { total: 0, qualified: 0, delivered: 0, converted: 0 };
    row.total += 1;
    if (QUALIFIED_STATUSES.has(lead.status)) row.qualified += 1;
    if (["delivered", "contacted", "in_progress", "converted"].includes(lead.status)) row.delivered += 1;
    if (lead.status === "converted") row.converted += 1;
    stats.set(key, row);
  }

  return stats;
}

export function conversionRate(stats: CampaignLeadStats): number {
  if (stats.total === 0) return 0;
  return Math.round((stats.converted / stats.total) * 1000) / 10;
}

export function costPerLead(spend: number, totalLeads: number): number | null {
  if (totalLeads === 0 || spend <= 0) return null;
  return Math.round((spend / totalLeads) * 100) / 100;
}
