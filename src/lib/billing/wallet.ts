import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChargeResult {
  ok: boolean;
  error?: string;
  balance?: number;
  charged?: number;
}

export async function chargeLeadDelivery(
  admin: SupabaseClient,
  partnerId: string,
  leadId: string,
  assignmentId: string,
  amount: number
): Promise<ChargeResult> {
  const { data, error } = await admin.rpc("connect_charge_lead_delivery", {
    p_partner_id: partnerId,
    p_lead_id: leadId,
    p_assignment_id: assignmentId,
    p_amount: amount,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const result = data as ChargeResult;
  return result ?? { ok: false, error: "charge_failed" };
}

export async function depositPartnerWallet(
  admin: SupabaseClient,
  partnerId: string,
  amount: number,
  reference?: string
): Promise<ChargeResult> {
  const { data, error } = await admin.rpc("connect_deposit_wallet", {
    p_partner_id: partnerId,
    p_amount: amount,
    p_reference: reference ?? null,
  });

  if (error) return { ok: false, error: error.message };
  return (data as ChargeResult) ?? { ok: false, error: "deposit_failed" };
}

export async function getPartnerWallet(admin: SupabaseClient, partnerId: string) {
  const { data: account } = await admin
    .from("connect_billing_accounts")
    .select("*")
    .eq("partner_id", partnerId)
    .maybeSingle();

  const { data: transactions } = await admin
    .from("connect_billing_transactions")
    .select("*")
    .eq("billing_account_id", account?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(20);

  return { account, transactions: transactions ?? [] };
}
