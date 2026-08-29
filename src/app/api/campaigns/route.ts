import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { buildCampaignTrackingUrl } from "@/lib/campaigns/attribution";
import { conversionRate, costPerLead, getCampaignLeadStats } from "@/lib/campaigns/stats";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createServiceClient();
  const [{ data: campaigns, error }, statsMap] = await Promise.all([
    admin.from("connect_campaigns").select(`
      id, name, platform, campaign_external_id, budget, spend,
      start_date, end_date, status, created_at,
      connect_sources ( id, utm_source, utm_medium, utm_campaign, type )
    `).order("created_at", { ascending: false }),
    getCampaignLeadStats(admin),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://leads-ten-steel.vercel.app";
  const unattributed = statsMap.get("unattributed") ?? { total: 0, qualified: 0, delivered: 0, converted: 0 };

  const enriched = (campaigns ?? []).map((campaign) => {
    const sources = Array.isArray(campaign.connect_sources)
      ? campaign.connect_sources
      : campaign.connect_sources
        ? [campaign.connect_sources]
        : [];
    const primarySource = sources[0];
    const leadStats = statsMap.get(campaign.id) ?? { total: 0, qualified: 0, delivered: 0, converted: 0 };
    const spend = Number(campaign.spend ?? 0);

    return {
      ...campaign,
      connect_sources: sources,
      stats: {
        ...leadStats,
        conversionRate: conversionRate(leadStats),
        costPerLead: costPerLead(spend, leadStats.total),
      },
      trackingUrl: primarySource
        ? buildCampaignTrackingUrl(`${appUrl}/apply`, {
            utmSource: primarySource.utm_source,
            utmMedium: primarySource.utm_medium,
            utmCampaign: primarySource.utm_campaign,
          })
        : `${appUrl}/apply`,
    };
  });

  return NextResponse.json({ campaigns: enriched, unattributed });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const {
    name,
    platform = "other",
    budget,
    spend = 0,
    start_date,
    end_date,
    status = "active",
    utm_source,
    utm_medium,
    utm_campaign,
    campaign_external_id,
  } = body;

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const admin = createServiceClient();
  const { data: campaign, error } = await admin
    .from("connect_campaigns")
    .insert({
      name,
      platform,
      budget: budget ? Number(budget) : null,
      spend: Number(spend) || 0,
      start_date: start_date || null,
      end_date: end_date || null,
      status,
      campaign_external_id: campaign_external_id || null,
    })
    .select("id")
    .single();

  if (error || !campaign) return NextResponse.json({ error: error?.message ?? "Create failed" }, { status: 500 });

  const sourceType = ["facebook", "google", "tiktok", "whatsapp"].includes(platform) ? platform : "other";
  await admin.from("connect_sources").insert({
    name: `${name} source`,
    type: sourceType,
    campaign_id: campaign.id,
    utm_source: utm_source || platform,
    utm_medium: utm_medium || "cpc",
    utm_campaign: utm_campaign || name.toLowerCase().replace(/\s+/g, "_"),
    active: true,
  });

  return NextResponse.json({ ok: true, campaignId: campaign.id });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { campaignId, spend, budget, status } = await req.json();
  if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (spend != null) updates.spend = Number(spend);
  if (budget != null) updates.budget = Number(budget);
  if (status) updates.status = status;

  const admin = createServiceClient();
  const { error } = await admin.from("connect_campaigns").update(updates).eq("id", campaignId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
