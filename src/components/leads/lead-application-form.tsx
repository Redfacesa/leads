"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CONSENT_TEXT_V01, DEBT_BANDS, EMPLOYMENT_OPTIONS, INCOME_BANDS, SA_PROVINCES } from "@/lib/utils";
import type { ConnectLeadCategory } from "@/lib/types";

const CATEGORY_ICONS: Record<string, string> = {
  personal_finance: "Personal Finance",
  debt_assistance: "Debt Assistance",
  credit_help: "Credit Help",
  business_funding: "Business Funding",
};

type Step = 1 | 2 | 3 | 4;

export function LeadApplicationForm({ categories }: { categories: ConnectLeadCategory[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState(searchParams.get("category") ?? "");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    province: "",
    city: "",
    employmentStatus: "",
    incomeBand: "",
    debtBand: "",
    underDebtReview: false,
    preferredContact: "phone",
    enquiryReason: "",
    consentGiven: false,
  });

  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug]
  );

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug,
          ...form,
          utmSource: searchParams.get("utm_source") ?? undefined,
          utmMedium: searchParams.get("utm_medium") ?? undefined,
          utmCampaign: searchParams.get("utm_campaign") ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      router.push(`/apply/success?ref=${encodeURIComponent(data.leadReference)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full ${step >= n ? "bg-[#dc2626]" : "bg-[#262626]"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>What do you need help with?</CardTitle>
            <CardDescription>
              Tell us your enquiry type. RedFace Connect matches you with relevant participating service providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategorySlug(cat.slug)}
                className={`min-h-[72px] rounded-lg border p-4 text-left transition-colors ${
                  categorySlug === cat.slug
                    ? "border-[#dc2626] bg-[#1a1a1a]"
                    : "border-[#262626] bg-[#111] hover:border-[#404040]"
                }`}
              >
                <p className="font-medium text-white">{CATEGORY_ICONS[cat.slug] ?? cat.name}</p>
                <p className="mt-1 text-xs text-[#8c8c8c]">{cat.description}</p>
              </button>
            ))}
            <div className="sm:col-span-2 flex justify-end">
              <Button disabled={!categorySlug} onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
            <CardDescription>How should a provider reach you about this enquiry?</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="phone">Mobile number</Label>
              <Input id="phone" type="tel" placeholder="082 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="province">Province</Label>
              <select
                id="province"
                className="flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm"
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
              <Label htmlFor="city">City (optional)</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                disabled={!form.firstName || !form.lastName || !form.phone || !form.province}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Your situation</CardTitle>
            <CardDescription>This helps providers understand your enquiry. It is not a credit approval.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="employment">Employment status</Label>
              <select
                id="employment"
                className="flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm"
                value={form.employmentStatus}
                onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
              >
                <option value="">Select</option>
                {EMPLOYMENT_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="income">Monthly income range</Label>
                <select
                  id="income"
                  className="flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm"
                  value={form.incomeBand}
                  onChange={(e) => setForm({ ...form, incomeBand: e.target.value })}
                >
                  <option value="">Select</option>
                  {INCOME_BANDS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="debt">Existing debt range</Label>
                <select
                  id="debt"
                  className="flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm"
                  value={form.debtBand}
                  onChange={(e) => setForm({ ...form, debtBand: e.target.value })}
                >
                  <option value="">Select</option>
                  {DEBT_BANDS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            {selectedCategory?.slug === "debt_assistance" && (
              <label className="flex items-center gap-2 text-sm text-[#bdbdbd]">
                <input
                  type="checkbox"
                  checked={form.underDebtReview}
                  onChange={(e) => setForm({ ...form, underDebtReview: e.target.checked })}
                />
                I am currently under debt review
              </label>
            )}
            <div>
              <Label htmlFor="reason">Tell us more about your enquiry</Label>
              <Textarea
                id="reason"
                placeholder="Briefly describe what help you need..."
                value={form.enquiryReason}
                onChange={(e) => setForm({ ...form, enquiryReason: e.target.value })}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Consent and submit</CardTitle>
            <CardDescription>Review before submitting your enquiry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[#262626] bg-[#111] p-4 text-sm text-[#bdbdbd]">
              <p><span className="text-[#8c8c8c]">Enquiry type:</span> {selectedCategory?.name}</p>
              <p className="mt-2"><span className="text-[#8c8c8c]">Name:</span> {form.firstName} {form.lastName}</p>
              <p className="mt-1"><span className="text-[#8c8c8c]">Phone:</span> {form.phone}</p>
              <p className="mt-1"><span className="text-[#8c8c8c]">Province:</span> {form.province}</p>
            </div>
            <label className="flex items-start gap-3 text-sm text-[#bdbdbd]">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.consentGiven}
                onChange={(e) => setForm({ ...form, consentGiven: e.target.checked })}
              />
              <span>{CONSENT_TEXT_V01}</span>
            </label>
            <p className="text-xs text-[#8c8c8c]">
              RedFace Connect does not guarantee approval for credit or debt services. Participating providers assess enquiries independently.
            </p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button disabled={!form.consentGiven || loading} onClick={submit}>
                {loading ? "Submitting..." : "Submit enquiry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
