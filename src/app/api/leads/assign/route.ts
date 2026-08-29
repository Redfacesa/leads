import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId, partnerId, price } = await req.json();
  if (!leadId || !partnerId) {
    return NextResponse.json({ error: "leadId and partnerId required" }, { status: 400 });
  }

  const admin = createServiceClient();

  const { data: partner } = await admin.from("connect_partners").select("id, status").eq("id", partnerId).maybeSingle();
  if (!partner || partner.status !== "active") {
    return NextResponse.json({ error: "Partner not active" }, { status: 400 });
  }

  const { data: assignment, error } = await admin
    .from("connect_lead_assignments")
    .insert({
      lead_id: leadId,
      partner_id: partnerId,
      status: "delivered",
      price: price ?? 100,
      delivered_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from("connect_leads").update({ status: "delivered" }).eq("id", leadId);

  await admin.from("connect_audit_logs").insert({
    action: "lead.assigned",
    entity_type: "connect_lead_assignments",
    entity_id: assignment.id,
    new_data: { lead_id: leadId, partner_id: partnerId },
  });

  return NextResponse.json({ ok: true, assignmentId: assignment.id });
}
