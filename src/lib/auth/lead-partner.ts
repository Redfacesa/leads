import { createClient } from "@/lib/supabase/server";

const LEAD_PARTNER_ROLES = new Set(["lead_partner"]);

export async function requireLeadPartnerSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("connect_profiles")
    .select("role, lead_partner_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.lead_partner_id || !LEAD_PARTNER_ROLES.has(profile.role)) {
    return { ok: false as const, error: "Lead partner account required", status: 403 };
  }

  const { data: org } = await supabase
    .from("connect_lead_partners")
    .select("id, business_name, status, verification_status, commission_rate, earnings_balance")
    .eq("id", profile.lead_partner_id)
    .maybeSingle();

  if (!org || org.status !== "active") {
    return { ok: false as const, error: "Lead partner account not active", status: 403 };
  }

  return {
    ok: true as const,
    supabase,
    user,
    leadPartnerId: profile.lead_partner_id,
    org,
  };
}
