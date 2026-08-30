import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireLeadPartnerSession } from "@/lib/auth/lead-partner";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizeSaPhone } from "@/lib/scoring";

const schema = z.object({
  categoryId: z.string().uuid(),
  partnerCampaignId: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(9),
  email: z.string().email().optional().or(z.literal("")),
  province: z.string().min(1),
  city: z.string().optional(),
  employmentStatus: z.string().optional(),
  incomeBand: z.string().optional(),
  debtBand: z.string().optional(),
  enquiryReason: z.string().optional(),
  consentConfirmed: z.literal(true),
  consentNote: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireLeadPartnerSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission" }, { status: 400 });

  const payload = parsed.data;
  const admin = createServiceClient();
  const phone = normalizeSaPhone(payload.phone);

  const { data: dup } = await admin
    .from("connect_lead_partner_submissions")
    .select("id")
    .eq("phone", phone)
    .eq("lead_partner_id", auth.leadPartnerId)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle();

  if (dup) {
    return NextResponse.json({ error: "You already submitted this number in the last 24 hours." }, { status: 409 });
  }

  const { data, error } = await admin
    .from("connect_lead_partner_submissions")
    .insert({
      lead_partner_id: auth.leadPartnerId,
      partner_campaign_id: payload.partnerCampaignId ?? null,
      category_id: payload.categoryId,
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      phone,
      email: payload.email?.trim() || null,
      province: payload.province,
      city: payload.city ?? null,
      employment_status: payload.employmentStatus ?? null,
      income_band: payload.incomeBand ?? null,
      debt_band: payload.debtBand ?? null,
      enquiry_reason: payload.enquiryReason ?? null,
      consent_confirmed: true,
      consent_note: payload.consentNote ?? "Partner attests first-party consent obtained",
      status: "pending_review",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: admins } = await admin
    .from("connect_profiles")
    .select("id")
    .in("role", ["admin", "connect_staff"]);

  if (admins?.length) {
    await admin.from("connect_notifications").insert(
      admins.map((a) => ({
        recipient_user_id: a.id,
        type: "lead_partner.submission",
        title: "Partner lead to review",
        message: `${auth.org.business_name} submitted a lead for quality review.`,
        entity_type: "connect_lead_partner_submissions",
        entity_id: data.id,
      }))
    );
  }

  return NextResponse.json({ ok: true, submissionId: data.id, status: "pending_review" });
}
