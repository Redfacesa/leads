import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { leadId, status, reason } = await req.json();
  if (!leadId || !status) {
    return NextResponse.json({ error: "leadId and status required" }, { status: 400 });
  }

  const admin = createServiceClient();
  const { error } = await admin.from("connect_leads").update({ status }).eq("id", leadId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (reason) {
    await admin.from("connect_lead_status_history").insert({
      lead_id: leadId,
      new_status: status,
      reason,
    });
  }

  return NextResponse.json({ ok: true });
}
