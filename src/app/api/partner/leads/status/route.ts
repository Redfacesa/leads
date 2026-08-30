import { NextRequest, NextResponse } from "next/server";
import { requirePartnerSession } from "@/lib/auth/partner";
import { createServiceClient } from "@/lib/supabase/server";

const ALLOWED = new Set([
  "contacted",
  "in_progress",
  "converted",
  "not_interested",
  "uncontactable",
]);

export async function PATCH(req: NextRequest) {
  const auth = await requirePartnerSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId, status, note } = await req.json();
  if (!leadId || !status || !ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid leadId or status" }, { status: 400 });
  }

  const admin = createServiceClient();

  const { data: assignment } = await admin
    .from("connect_lead_assignments")
    .select("id")
    .eq("lead_id", leadId)
    .eq("partner_id", auth.partnerId)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ error: "Lead not assigned to your organisation" }, { status: 403 });
  }

  const { data: before } = await admin.from("connect_leads").select("status").eq("id", leadId).maybeSingle();

  const { error } = await admin.from("connect_leads").update({ status }).eq("id", leadId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("connect_lead_status_history").insert({
    lead_id: leadId,
    old_status: before?.status ?? null,
    new_status: status,
    reason: note ?? `Updated by partner (${auth.role})`,
  });

  await admin.from("connect_audit_logs").insert({
    action: "lead.partner_status",
    entity_type: "connect_leads",
    entity_id: leadId,
    new_data: { status, partner_id: auth.partnerId, note },
  });

  return NextResponse.json({ ok: true, status });
}
