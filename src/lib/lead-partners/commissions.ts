import type { SupabaseClient } from "@supabase/supabase-js";

export async function creditLeadPartnerCommission(
  admin: SupabaseClient,
  leadId: string,
  saleAmount: number,
  referenceType: string,
  referenceId: string
) {
  const { data } = await admin.rpc("connect_credit_lead_partner_commission", {
    p_lead_id: leadId,
    p_sale_amount: saleAmount,
    p_reference_type: referenceType,
    p_reference_id: referenceId,
  });
  return data as { ok?: boolean; commission?: number } | null;
}
