import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { autoMatchAndDeliver } from "@/lib/matching/engine";

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const admin = createServiceClient();
  const { data: lead, error } = await admin
    .from("connect_leads")
    .select("id, category_id, province, lead_score, income_band, status, connect_lead_categories(requires_regulated_partner)")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const regulated = !!(lead as { connect_lead_categories?: { requires_regulated_partner: boolean } })
    .connect_lead_categories?.requires_regulated_partner;

  const match = await autoMatchAndDeliver(admin, lead, regulated);
  if (!match) return NextResponse.json({ ok: false, matched: false });

  return NextResponse.json({ ok: true, matched: true, partnerName: match.partnerName, price: match.price });
}
