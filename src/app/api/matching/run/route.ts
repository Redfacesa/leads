import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { autoMatchAndDeliver } from "@/lib/matching/engine";
import { relationOne } from "@/lib/supabase/relations";

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

  const category = relationOne(
    (lead as { connect_lead_categories?: { requires_regulated_partner: boolean } | { requires_regulated_partner: boolean }[] })
      .connect_lead_categories
  );
  const regulated = !!category?.requires_regulated_partner;

  let matchLead = { ...lead, lead_reference: undefined as string | undefined };
  if (!["qualified", "verified"].includes(lead.status)) {
    if (lead.lead_score >= 70) {
      await admin.from("connect_leads").update({ status: "qualified" }).eq("id", leadId);
      matchLead = { ...matchLead, status: "qualified" };
    } else {
      return NextResponse.json({
        ok: false,
        matched: false,
        error: "Lead must be qualified (score 70+) before auto-match",
      });
    }
  }

  const { data: refRow } = await admin.from("connect_leads").select("lead_reference").eq("id", leadId).maybeSingle();
  matchLead.lead_reference = refRow?.lead_reference;

  const match = await autoMatchAndDeliver(admin, matchLead, regulated);
  if (!match) {
    return NextResponse.json({
      ok: false,
      matched: false,
      error: "No matching rule found or partner wallet insufficient",
    });
  }

  return NextResponse.json({ ok: true, matched: true, partnerName: match.partnerName, price: match.price });
}
