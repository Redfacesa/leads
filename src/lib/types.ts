export type ConnectRole =
  | "admin"
  | "connect_staff"
  | "partner_owner"
  | "partner_admin"
  | "partner_agent"
  | "partner_viewer";

export type LeadStatus =
  | "new"
  | "verifying"
  | "verified"
  | "qualified"
  | "matched"
  | "delivered"
  | "contacted"
  | "in_progress"
  | "converted"
  | "rejected"
  | "duplicate"
  | "invalid"
  | "uncontactable"
  | "not_interested"
  | "not_eligible"
  | "expired";

export type PartnerStatus = "pending" | "active" | "suspended" | "archived";
export type PartnerVerificationStatus = "unverified" | "pending_review" | "verified" | "rejected" | "expired";

export interface ConnectLeadCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  requires_regulated_partner: boolean;
}

export interface ConnectLead {
  id: string;
  lead_reference: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  province: string;
  city: string | null;
  employment_status: string | null;
  income_band: string | null;
  debt_band: string | null;
  under_debt_review: boolean | null;
  preferred_contact: string | null;
  category_id: string;
  source_id: string | null;
  enquiry_reason: string | null;
  lead_score: number;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  connect_lead_categories?: ConnectLeadCategory | null;
}

export interface ConnectPartner {
  id: string;
  business_name: string;
  trading_name: string | null;
  registration_number: string | null;
  partner_type: string;
  website: string | null;
  email: string;
  phone: string | null;
  status: PartnerStatus;
  verification_status: PartnerVerificationStatus;
  created_at: string;
}

export interface ConnectLeadAssignment {
  id: string;
  lead_id: string;
  partner_id: string;
  status: string;
  price: number | null;
  assigned_at: string;
  delivered_at: string | null;
  connect_partners?: ConnectPartner | null;
}

export interface DashboardStats {
  total_leads: number;
  new_today: number;
  qualified: number;
  partners: number;
  converted: number;
}

export interface LeadSubmitPayload {
  categorySlug: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  province: string;
  city?: string;
  employmentStatus?: string;
  incomeBand?: string;
  debtBand?: string;
  underDebtReview?: boolean;
  preferredContact?: string;
  enquiryReason?: string;
  consentGiven: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}
