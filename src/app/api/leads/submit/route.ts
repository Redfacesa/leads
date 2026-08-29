import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { buildLeadRecord, normalizeSaPhone } from "@/lib/scoring";
import { CONSENT_TEXT_V01 } from "@/lib/utils";

const payloadSchema = z.object({
  categorySlug: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(9).max(20),
  province: z.string().min(1),
  city: z.string().optional(),
  employmentStatus: z.string().optional(),
  incomeBand: z.string().optional(),
  debtBand: z.string().optional(),
  underDebtReview: z.boolean().optional(),
  preferredContact: z.string().optional(),
  enquiryReason: z.string().optional(),
  consentGiven: z.literal(true),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    const payload = parsed.data;
    const admin = createServiceClient();

    const { data: category, error: catErr } = await admin
      .from("connect_lead_categories")
      .select("id, slug, name")
      .eq("slug", payload.categorySlug)
      .eq("active", true)
      .maybeSingle();

    if (catErr || !category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const phone = normalizeSaPhone(payload.phone);

    const { data: duplicate } = await admin
      .from("connect_leads")
      .select("id, lead_reference")
      .eq("phone", phone)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: "We already received a recent enquiry from this number.", leadReference: duplicate.lead_reference },
        { status: 409 }
      );
    }

    const { data: source } = await admin
      .from("connect_sources")
      .select("id")
      .eq("type", "organic")
      .limit(1)
      .maybeSingle();

    const leadRecord = buildLeadRecord(payload, category.id, source?.id ?? null);

    const { data: lead, error: leadErr } = await admin
      .from("connect_leads")
      .insert(leadRecord)
      .select("id, lead_reference, status, lead_score")
      .single();

    if (leadErr || !lead) {
      console.error(leadErr);
      return NextResponse.json({ error: "Could not save enquiry" }, { status: 500 });
    }

    const consentHash = createHash("sha256").update(CONSENT_TEXT_V01).digest("hex");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    await admin.from("connect_lead_consent").insert({
      lead_id: lead.id,
      consent_type: "enquiry_and_contact",
      purpose: "Connect enquiry with relevant participating service providers",
      consent_given: true,
      policy_version: "v0.1",
      consent_text_hash: consentHash,
      source: "web_form",
      ip_address: ip,
      user_agent: req.headers.get("user-agent"),
    });

    await admin.from("connect_audit_logs").insert({
      action: "lead.created",
      entity_type: "connect_leads",
      entity_id: lead.id,
      new_data: { lead_reference: lead.lead_reference, status: lead.status, score: lead.lead_score },
    });

    return NextResponse.json({
      ok: true,
      leadReference: lead.lead_reference,
      status: lead.status,
      score: lead.lead_score,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
