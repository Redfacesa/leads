import { createClient } from "@/lib/supabase/server";

export async function requirePartnerSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("connect_profiles")
    .select("role, partner_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.partner_id) {
    return { ok: false as const, error: "No partner linked to this account", status: 403 };
  }

  return { ok: true as const, supabase, user, partnerId: profile.partner_id, role: profile.role };
}
