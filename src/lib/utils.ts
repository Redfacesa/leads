import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(amount);
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export const EMPLOYMENT_OPTIONS = [
  "Employed (permanent)",
  "Employed (contract)",
  "Self-employed",
  "Part-time",
  "Unemployed",
  "Retired",
  "Student",
] as const;

export const INCOME_BANDS = [
  "Under R5,000",
  "R5,000 – R10,000",
  "R10,000 – R15,000",
  "R15,000 – R20,000",
  "R20,000 – R35,000",
  "Over R35,000",
] as const;

export const DEBT_BANDS = [
  "Under R50,000",
  "R50,000 – R100,000",
  "R100,000 – R250,000",
  "R250,000 – R500,000",
  "Over R500,000",
  "Prefer not to say",
] as const;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  pending_review: "Pending review",
  active: "Active",
  suspended: "Suspended",
  archived: "Archived",
  accepted: "Accepted",
  paid: "Paid",
  new: "New",
  verifying: "Verifying",
  verified: "Verified",
  qualified: "Qualified",
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  matched: "Matched",
  delivered: "Delivered",
  contacted: "Contacted",
  in_progress: "In progress",
  converted: "Converted",
  rejected: "Rejected",
  duplicate: "Duplicate",
  invalid: "Invalid",
  uncontactable: "Uncontactable",
  not_interested: "Not interested",
  not_eligible: "Not eligible",
  expired: "Expired",
  archived: "Archived",
  active: "Active",
};

export const CONSENT_TEXT_V01 =
  "By submitting this enquiry, you agree that RedFace Connect and selected relevant service providers may contact you about your enquiry. You may withdraw marketing consent where applicable. RedFace Connect does not approve credit or debt review. Any financial decision remains with the authorised provider.";
