"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEBT_BANDS,
  EMPLOYMENT_OPTIONS,
  INCOME_BANDS,
  SA_PROVINCES,
} from "@/lib/utils";

type Category = { id: string; name: string; slug: string };
type Campaign = { id: string; name: string };

export default function LeadPartnerSubmitPage() {
  const [active, setActive] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState({
    categoryId: "",
    partnerCampaignId: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    province: "",
    city: "",
    employmentStatus: "",
    incomeBand: "",
    debtBand: "",
    enquiryReason: "",
    consentConfirmed: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("connect_profiles")
        .select("lead_partner_id")
        .maybeSingle();

      if (!profile?.lead_partner_id) {
        setActive(false);
        return;
      }

      const { data: org } = await supabase
        .from("connect_lead_partners")
        .select("status")
        .eq("id", profile.lead_partner_id)
        .maybeSingle();

      if (org?.status !== "active") {
        setActive(false);
        return;
      }
      setActive(true);

      const [{ data: cats }, { data: camps }] = await Promise.all([
        supabase.from("connect_lead_categories").select("id, name, slug").eq("active", true).order("name"),
        supabase
          .from("connect_lead_partner_campaigns")
          .select("id, name")
          .eq("lead_partner_id", profile.lead_partner_id)
          .eq("active", true)
          .order("name"),
      ]);

      setCategories((cats ?? []) as Category[]);
      setCampaigns((camps ?? []) as Campaign[]);
    }
    load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.consentConfirmed) {
      setError("You must confirm first-party consent before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/lead-partners/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        partnerCampaignId: form.partnerCampaignId || undefined,
        consentConfirmed: true,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Submission failed");
      return;
    }

    setSuccess("Lead submitted for quality review. You will see status updates in My submissions.");
    setForm({
      categoryId: form.categoryId,
      partnerCampaignId: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      province: "",
      city: "",
      employmentStatus: "",
      incomeBand: "",
      debtBand: "",
      enquiryReason: "",
      consentConfirmed: false,
    });
  }

  if (active === null) {
    return <p className="text-[#8c8c8c]">Loading...</p>;
  }

  if (!active) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-[#bdbdbd]">An active partner account is required to submit leads.</p>
          <Button asChild className="mt-4">
            <Link href="/partners-network/apply">Apply for partner access</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Submit a lead</h2>
        <p className="text-[#8c8c8c]">Every submission is reviewed before it enters Red Leads inventory</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Lead details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Category</Label>
              <select
                className="mt-1 w-full rounded-md border border-[#262626] bg-[#111] px-3 py-2 text-white"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {campaigns.length > 0 && (
              <div className="sm:col-span-2">
                <Label>Campaign (optional)</Label>
                <select
                  className="mt-1 w-full rounded-md border border-[#262626] bg-[#111] px-3 py-2 text-white"
                  value={form.partnerCampaignId}
                  onChange={(e) => setForm({ ...form, partnerCampaignId: e.target.value })}
                >
                  <option value="">No campaign</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label>First name</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <Label>Last name</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Province</Label>
              <select
                className="mt-1 w-full rounded-md border border-[#262626] bg-[#111] px-3 py-2 text-white"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                required
              >
                <option value="">Select province</option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>City (optional)</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label>Employment</Label>
              <select
                className="mt-1 w-full rounded-md border border-[#262626] bg-[#111] px-3 py-2 text-white"
                value={form.employmentStatus}
                onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
              >
                <option value="">Select</option>
                {EMPLOYMENT_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Income band</Label>
              <select
                className="mt-1 w-full rounded-md border border-[#262626] bg-[#111] px-3 py-2 text-white"
                value={form.incomeBand}
                onChange={(e) => setForm({ ...form, incomeBand: e.target.value })}
              >
                <option value="">Select</option>
                {INCOME_BANDS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Debt band (if applicable)</Label>
              <select
                className="mt-1 w-full rounded-md border border-[#262626] bg-[#111] px-3 py-2 text-white"
                value={form.debtBand}
                onChange={(e) => setForm({ ...form, debtBand: e.target.value })}
              >
                <option value="">Select</option>
                {DEBT_BANDS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Enquiry reason (optional)</Label>
              <Input value={form.enquiryReason} onChange={(e) => setForm({ ...form, enquiryReason: e.target.value })} />
            </div>

            <label className="sm:col-span-2 flex items-start gap-3 rounded-md border border-[#262626] bg-[#0a0a0a] p-4">
              <input
                type="checkbox"
                checked={form.consentConfirmed}
                onChange={(e) => setForm({ ...form, consentConfirmed: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm text-[#bdbdbd]">
                I confirm this person gave first-party consent to be contacted about this enquiry, and I can evidence consent if requested.
              </span>
            </label>

            {error && <p className="sm:col-span-2 text-sm text-[#dc2626]">{error}</p>}
            {success && <p className="sm:col-span-2 text-sm text-emerald-400">{success}</p>}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit for review"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
