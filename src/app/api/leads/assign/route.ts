import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { deliverLeadToPartner } from "@/lib/matching/engine";

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

  const delivered = await deliverLeadToPartner(admin, leadId, {
    partnerId,
    partnerName: partner.business_name,
    ruleId: null,
    price: Number(price ?? 100),
  });

  if (!delivered) return NextResponse.json({ error: "Assignment failed" }, { status: 500 });

  await admin.from("connect_audit_logs").insert({
    action: "lead.assigned",
    entity_type: "connect_lead_assignments",
    entity_id: delivered.assignmentId,
    new_data: { lead_id: leadId, partner_id: partnerId, manual: true },
  });

  return NextResponse.json({ ok: true, assignmentId: delivered.assignmentId });
}
