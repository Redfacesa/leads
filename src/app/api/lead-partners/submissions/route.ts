import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { acceptLeadPartnerSubmission } from "@/lib/lead-partners/accept";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.supabase
    .from("connect_lead_partner_submissions")
    .select("*, connect_lead_categories(name), connect_lead_partners(business_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submissions: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { submissionId, action, rejectionReason } = await req.json();
  if (!submissionId || !action) {
    return NextResponse.json({ error: "submissionId and action required" }, { status: 400 });
  }

  const admin = createServiceClient();

  if (action === "accept") {
    const result = await acceptLeadPartnerSubmission(admin, submissionId, auth.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, leadId: result.leadId, leadReference: result.leadReference });
  }

  if (action === "reject") {
    await admin.from("connect_lead_partner_submissions").update({
      status: "rejected",
      rejection_reason: rejectionReason ?? "Did not pass quality review",
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", submissionId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
