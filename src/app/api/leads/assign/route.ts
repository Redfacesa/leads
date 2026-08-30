import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { deliverLeadToPartner } from "@/lib/matching/engine";

const ERROR_MESSAGES: Record<string, string> = {
  insufficient_balance: "Partner wallet balance is too low. Top up in Revenue before assigning.",
  billing_suspended: "Partner billing account is suspended.",
  assignment_failed: "Could not create assignment.",
};

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId, partnerId, price } = await req.json();
  if (!leadId || !partnerId) {
    return NextResponse.json({ error: "leadId and partnerId required" }, { status: 400 });
  }

  const admin = createServiceClient();

  const { data: partner } = await admin.from("connect_partners").select("id, status, business_name").eq("id", partnerId).maybeSingle();
  if (!partner || partner.status !== "active") {
    return NextResponse.json({ error: "Partner not active" }, { status: 400 });
  }

  const { data: lead } = await admin.from("connect_leads").select("lead_reference, status").eq("id", leadId).maybeSingle();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const delivered = await deliverLeadToPartner(admin, leadId, {
    partnerId,
    partnerName: partner.business_name,
    ruleId: null,
    price: Number(price ?? 100),
  }, { leadReference: lead.lead_reference });

  if (!delivered.ok) {
    return NextResponse.json(
      { error: ERROR_MESSAGES[delivered.error] ?? delivered.error },
      { status: 402 }
    );
  }

  await admin.from("connect_audit_logs").insert({
    action: "lead.assigned",
    entity_type: "connect_lead_assignments",
    entity_id: delivered.assignmentId,
    new_data: { lead_id: leadId, partner_id: partnerId, manual: true },
  });

  return NextResponse.json({ ok: true, assignmentId: delivered.assignmentId });
}
