"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/branding";

const CHANNEL_OPTIONS = [
  "Facebook / Meta ads",
  "Google ads",
  "WhatsApp campaigns",
  "SMS marketing",
  "Organic / SEO",
  "Affiliate network",
  "Other",
];

export default function LeadPartnerApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    channels: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function toggleChannel(channel: string) {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/lead-partners/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Application failed");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/partners-network"), 2000);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-white">Application submitted</h2>
        <p className="text-[#bdbdbd]">We will review your agency profile and notify you once approved.</p>
        <Button asChild><Link href="/partners-network">Go to partner home</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Apply to the Lead Partner Network</h2>
        <p className="text-[#8c8c8c]">
          Run campaigns, submit qualified leads, and earn commission through {BRAND.name}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Agency or marketer details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Business / agency name</Label>
              <Input
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Contact name</Label>
              <Input
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Business email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Website (optional)</Label>
              <Input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://"
              />
            </div>
            <div>
              <Label>Primary channels</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => toggleChannel(channel)}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      form.channels.includes(channel)
                        ? "border-[#dc2626] bg-[#dc2626] text-white"
                        : "border-[#262626] text-[#bdbdbd] hover:border-[#444]"
                    }`}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-[#dc2626]">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit application"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-[#666]">
        By applying you agree to Red Leads partner terms: first-party consent only, no recycled lists, and quality review on every submission.
      </p>
    </div>
  );
}
