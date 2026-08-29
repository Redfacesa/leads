import type { SupabaseClient } from "@supabase/supabase-js";

export interface UtmParams {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export interface AttributionResult {
  sourceId: string | null;
  campaignId: string | null;
}

export async function resolveLeadAttribution(
  admin: SupabaseClient,
  utm: UtmParams
): Promise<AttributionResult> {
  const { utmSource, utmMedium, utmCampaign } = utm;

  if (utmSource || utmMedium || utmCampaign) {
    let query = admin.from("connect_sources").select("id, campaign_id").eq("active", true);

    if (utmSource) query = query.eq("utm_source", utmSource);
    if (utmMedium) query = query.eq("utm_medium", utmMedium);
    if (utmCampaign) query = query.eq("utm_campaign", utmCampaign);

    const { data: matched } = await query.limit(1).maybeSingle();
    if (matched) {
      return { sourceId: matched.id, campaignId: matched.campaign_id };
    }
  }

  const { data: organic } = await admin
    .from("connect_sources")
    .select("id, campaign_id")
    .eq("type", "organic")
    .limit(1)
    .maybeSingle();

  return { sourceId: organic?.id ?? null, campaignId: organic?.campaign_id ?? null };
}

export function buildCampaignTrackingUrl(baseUrl: string, utm: UtmParams): string {
  const url = new URL(baseUrl);
  if (utm.utmSource) url.searchParams.set("utm_source", utm.utmSource);
  if (utm.utmMedium) url.searchParams.set("utm_medium", utm.utmMedium);
  if (utm.utmCampaign) url.searchParams.set("utm_campaign", utm.utmCampaign);
  return url.toString();
}
