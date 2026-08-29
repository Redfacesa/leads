import type { LeadSubmitPayload } from "./types";

export interface ScoreInput {
  phone: string;
  email?: string;
  province: string;
  employmentStatus?: string;
  incomeBand?: string;
  debtBand?: string;
  enquiryReason?: string;
  categorySlug: string;
}

export function scoreLead(input: ScoreInput): number {
  let score = 0;

  if (input.phone && input.phone.replace(/\D/g, "").length >= 10) score += 20;
  if (input.email && input.email.includes("@")) score += 15;
  if (input.province) score += 10;
  if (input.employmentStatus) score += 10;
  if (input.incomeBand) score += 10;
  if (input.debtBand && input.debtBand !== "Prefer not to say") score += 10;
  if (input.enquiryReason && input.enquiryReason.trim().length >= 20) score += 10;
  if (input.categorySlug) score += 15;

  return Math.min(100, score);
}

export function qualifyStatus(score: number): "qualified" | "verified" | "new" {
  if (score >= 70) return "qualified";
  if (score >= 40) return "verified";
  return "new";
}

export function normalizeSaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+27${digits.slice(1)}`;
  if (digits.length === 9) return `+27${digits}`;
  return phone.trim();
}

export function buildLeadRecord(payload: LeadSubmitPayload, categoryId: string, sourceId: string | null) {
  const score = scoreLead({
    phone: payload.phone,
    email: payload.email,
    province: payload.province,
    employmentStatus: payload.employmentStatus,
    incomeBand: payload.incomeBand,
    debtBand: payload.debtBand,
    enquiryReason: payload.enquiryReason,
    categorySlug: payload.categorySlug,
  });

  const status = qualifyStatus(score);

  return {
    first_name: payload.firstName.trim(),
    last_name: payload.lastName.trim(),
    email: payload.email?.trim() || null,
    phone: normalizeSaPhone(payload.phone),
    province: payload.province,
    city: payload.city?.trim() || null,
    employment_status: payload.employmentStatus || null,
    income_band: payload.incomeBand || null,
    debt_band: payload.debtBand || null,
    under_debt_review: payload.underDebtReview ?? null,
    preferred_contact: payload.preferredContact || "phone",
    category_id: categoryId,
    source_id: sourceId,
    enquiry_reason: payload.enquiryReason?.trim() || null,
    lead_score: score,
    status,
    utm_source: payload.utmSource || null,
    utm_medium: payload.utmMedium || null,
    utm_campaign: payload.utmCampaign || null,
  };
}
