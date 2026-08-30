import type { SupabaseClient } from "@supabase/supabase-js";
import { scoreLead, qualifyStatus, normalizeSaPhone } from "@/lib/scoring";
import { CONSENT_TEXT_V01 } from "@/lib/utils";
import { createHash } from "crypto";

interface SubmissionRow {
  id: string;
  lead_partner_id: string;
  category_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  province: string;
  city: string | null;
  employment_status: string | null;
  income_band: string | null;
  debt_band: string | null;
  enquiry_reason: string | null;
  consent_confirmed: boolean;
  connect_lead_categories?: { slug: string } | { slug: string }[];
}

export async function acceptLeadPartnerSubmission(
  admin: SupabaseClient,
  submissionId: string,
  reviewerId: string
): Promise<{ ok: true; leadId: string; leadReference: string } | { ok: false; error: string }> {
  const { data: sub, error } = await admin
    .from("connect_lead_partner_submissions")
    .select("*, connect_lead_categories(slug)")
    .eq("id", submissionId)
    .maybeSingle();

  if (error || !sub) return { ok: false, error: "submission_not_found" };
  if (sub.status !== "pending_review") return { ok: false, error: "already_reviewed" };
  if (!sub.consent_confirmed) return { ok: false, error: "consent_not_confirmed" };

  const submission = sub as SubmissionRow;
  const phone = normalizeSaPhone(submission.phone);
  const categorySlug = Array.isArray(submission.connect_lead_categories)
    ? submission.connect_lead_categories[0]?.slug
    : submission.connect_lead_categories?.slug;

  const { data: duplicate } = await admin
    .from("connect_leads")
    .select("id")
    .eq("phone", phone)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle();

  if (duplicate) {
    await admin.from("connect_lead_partner_submissions").update({
      status: "duplicate",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: "Duplicate phone within 7 days",
    }).eq("id", submissionId);
    return { ok: false, error: "duplicate_phone" };
  }

  const score = scoreLead({
    phone,
    email: submission.email ?? undefined,
    province: submission.province,
    employmentStatus: submission.employment_status ?? undefined,
    incomeBand: submission.income_band ?? undefined,
    debtBand: submission.debt_band ?? undefined,
    enquiryReason: submission.enquiry_reason ?? undefined,
    categorySlug: categorySlug ?? "",
  });

  const { data: lead, error: leadErr } = await admin
    .from("connect_leads")
    .insert({
      first_name: submission.first_name,
      last_name: submission.last_name,
      email: submission.email,
      phone,
      province: submission.province,
      city: submission.city,
      employment_status: submission.employment_status,
      income_band: submission.income_band,
      debt_band: submission.debt_band,
      enquiry_reason: submission.enquiry_reason,
      category_id: submission.category_id,
      lead_score: score,
      status: qualifyStatus(score),
      lead_partner_id: submission.lead_partner_id,
      submission_id: submissionId,
    })
    .select("id, lead_reference")
    .single();

  if (leadErr || !lead) return { ok: false, error: "lead_create_failed" };

  const consentHash = createHash("sha256").update(CONSENT_TEXT_V01).digest("hex");
  await admin.from("connect_lead_consent").insert({
    lead_id: lead.id,
    consent_type: "enquiry_and_contact",
    purpose: "Lead submitted by approved Red Leads partner with consumer consent",
    consent_given: true,
    policy_version: "v0.1-partner",
    consent_text_hash: consentHash,
    source: "lead_partner_submission",
  });

  await admin.from("connect_lead_partner_submissions").update({
    status: "accepted",
    lead_id: lead.id,
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
  }).eq("id", submissionId);

  await admin.from("connect_audit_logs").insert({
    action: "lead_partner.submission_accepted",
    entity_type: "connect_lead_partner_submissions",
    entity_id: submissionId,
    new_data: { lead_id: lead.id, lead_reference: lead.lead_reference },
  });

  return { ok: true, leadId: lead.id, leadReference: lead.lead_reference };
}
