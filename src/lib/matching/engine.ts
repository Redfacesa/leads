import type { SupabaseClient } from "@supabase/supabase-js";
import { relationOne } from "@/lib/supabase/relations";
import { chargeLeadDelivery } from "@/lib/billing/wallet";
import { notifyPartnerLeadDelivered } from "@/lib/notifications/notify";
import { enqueuePartnerWebhooks } from "@/lib/webhooks/deliver";
import { parseIncomeMin, parseIncomeMax } from "./income";

export interface MatchableLead {
  id: string;
  category_id: string;
  province: string;
  lead_score: number;
  income_band?: string | null;
  status: string;
}

export interface PartnerRuleRow {
  id: string;
  partner_id: string;
  category_id: string | null;
  name: string;
  priority: number;
  min_income: number | null;
  max_income: number | null;
  lead_price: number;
  daily_limit: number | null;
  conditions: Record<string, unknown> | null;
  active: boolean;
  connect_partners?:
    | {
        id: string;
        business_name: string;
        status: string;
        verification_status: string;
      }
    | {
        id: string;
        business_name: string;
        status: string;
        verification_status: string;
      }[]
    | null;
}

export interface MatchResult {
  partnerId: string;
  partnerName: string;
  ruleId: string | null;
  price: number;
}

function ruleMinScore(rule: PartnerRuleRow): number {
  const fromConditions = rule.conditions?.min_score;
  if (typeof fromConditions === "number") return fromConditions;
  return 70;
}

function ruleProvince(rule: PartnerRuleRow): string | null {
  const p = rule.conditions?.province;
  return typeof p === "string" && p.length > 0 ? p : null;
}

export async function findMatchingPartner(
  admin: SupabaseClient,
  lead: MatchableLead,
  options?: { requiresRegulatedPartner?: boolean }
): Promise<MatchResult | null> {
  const { data: rules, error } = await admin
    .from("connect_partner_rules")
    .select(`
      id, partner_id, category_id, name, priority, min_income, max_income,
      lead_price, daily_limit, conditions, active,
      connect_partners!inner ( id, business_name, status, verification_status )
    `)
    .eq("active", true)
    .order("priority", { ascending: true });

  if (error || !rules?.length) return null;

  const incomeMin = parseIncomeMin(lead.income_band);
  const incomeMax = parseIncomeMax(lead.income_band);

  for (const raw of rules) {
    const rule = raw as PartnerRuleRow;
    const partner = relationOne(rule.connect_partners);
    if (!partner || partner.status !== "active") continue;

    if (options?.requiresRegulatedPartner && partner.verification_status !== "verified") {
      continue;
    }

    if (rule.category_id && rule.category_id !== lead.category_id) continue;

    const requiredProvince = ruleProvince(rule);
    if (requiredProvince && requiredProvince !== lead.province) continue;

    const covered = await partnerCoversProvince(admin, rule.partner_id, lead.province);
    if (!covered) continue;

    if (lead.lead_score < ruleMinScore(rule)) continue;

    if (rule.min_income != null && incomeMax != null && incomeMax < Number(rule.min_income)) continue;
    if (rule.max_income != null && incomeMin != null && incomeMin > Number(rule.max_income)) continue;

    if (rule.daily_limit != null) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await admin
        .from("connect_lead_assignments")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", rule.partner_id)
        .gte("assigned_at", startOfDay.toISOString());
      if ((count ?? 0) >= rule.daily_limit) continue;
    }

    return {
      partnerId: rule.partner_id,
      partnerName: partner.business_name,
      ruleId: rule.id,
      price: Number(rule.lead_price ?? 100),
    };
  }

  return null;
}

async function partnerCoversProvince(
  admin: SupabaseClient,
  partnerId: string,
  province: string
): Promise<boolean> {
  const { data: coverage, count } = await admin
    .from("connect_partner_coverage")
    .select("province", { count: "exact" })
    .eq("partner_id", partnerId)
    .eq("active", true);

  if (!coverage?.length) return true;
  return coverage.some((row) => row.province === province);
}

export async function deliverLeadToPartner(
  admin: SupabaseClient,
  leadId: string,
  match: MatchResult,
  meta?: { leadReference?: string }
): Promise<{ assignmentId: string } | null> {
  const { data: assignment, error } = await admin
    .from("connect_lead_assignments")
    .insert({
      lead_id: leadId,
      partner_id: match.partnerId,
      rule_id: match.ruleId || null,
      status: "delivered",
      price: match.price,
      delivered_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !assignment) return null;

  const charge = await chargeLeadDelivery(admin, match.partnerId, leadId, assignment.id, match.price);
  if (!charge.ok) {
    await admin.from("connect_lead_assignments").delete().eq("id", assignment.id);
    return null;
  }

  await admin.from("connect_leads").update({ status: "delivered" }).eq("id", leadId);

  await admin.from("connect_audit_logs").insert({
    action: "lead.delivered",
    entity_type: "connect_lead_assignments",
    entity_id: assignment.id,
    new_data: {
      lead_id: leadId,
      partner_id: match.partnerId,
      rule_id: match.ruleId,
      partner_name: match.partnerName,
      price: match.price,
      balance: charge.balance,
    },
  });

  const ref = meta?.leadReference ?? leadId;
  await notifyPartnerLeadDelivered(admin, match.partnerId, ref, leadId);
  await enqueuePartnerWebhooks(admin, match.partnerId, "lead.delivered", {
    lead_id: leadId,
    lead_reference: ref,
    partner_id: match.partnerId,
    price: match.price,
  });

  return { assignmentId: assignment.id };
}

export async function autoMatchAndDeliver(
  admin: SupabaseClient,
  lead: MatchableLead & { lead_reference?: string },
  requiresRegulatedPartner: boolean
): Promise<MatchResult | null> {
  if (!["qualified", "verified"].includes(lead.status)) return null;

  const match = await findMatchingPartner(admin, lead, { requiresRegulatedPartner });
  if (!match) return null;

  const delivered = await deliverLeadToPartner(admin, lead.id, match, {
    leadReference: lead.lead_reference,
  });
  return delivered ? match : null;
}
