import Link from "next/link";
import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { LeadApplicationForm } from "@/components/leads/lead-application-form";
import type { ConnectLeadCategory } from "@/lib/types";

async function getCategories(): Promise<ConnectLeadCategory[]> {
  try {
    const admin = createServiceClient();
    const { data } = await admin
      .from("connect_lead_categories")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    return (data ?? []) as ConnectLeadCategory[];
  } catch {
    return [
      { id: "1", name: "Personal Finance Enquiry", slug: "personal_finance", description: null, active: true, requires_regulated_partner: false },
      { id: "2", name: "Debt Assistance", slug: "debt_assistance", description: null, active: true, requires_regulated_partner: true },
      { id: "3", name: "Credit-Related Help", slug: "credit_help", description: null, active: true, requires_regulated_partner: false },
      { id: "4", name: "Business Funding", slug: "business_funding", description: null, active: true, requires_regulated_partner: false },
    ];
  }
}

export default async function ApplyPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#262626] bg-[#111]">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-semibold text-white">
            RedFace <span className="text-[#dc2626]">Connect</span>
          </Link>
          <Link href="/" className="text-sm text-[#8c8c8c] hover:text-white">Back</Link>
        </div>
      </header>
      <div className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl mb-8">
          <h1 className="text-2xl font-bold text-white">Submit your enquiry</h1>
          <p className="mt-2 text-[#bdbdbd]">
            Complete the steps below. A relevant participating provider may contact you.
          </p>
        </div>
        <Suspense fallback={<p className="text-center text-[#8c8c8c]">Loading form...</p>}>
          <LeadApplicationForm categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}
