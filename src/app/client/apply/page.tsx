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

export default function ClientApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: "",
    email: "",
    phone: "",
    registration_number: "",
    website: "",
    partner_type: "financial_services",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/partner/apply", {
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
    setTimeout(() => router.push("/client"), 2000);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-white">Application submitted</h2>
        <p className="text-[#bdbdbd]">We will review your business and notify you once approved.</p>
        <Button asChild><Link href="/client">Go to dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Create client account</h2>
        <p className="text-[#8c8c8c]">Apply to buy leads from {BRAND.name} campaigns and marketplace</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Business details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Registered business name</Label>
              <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
            </div>
            <div>
              <Label>Business email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Registration number (NCR / FSP / CIPC)</Label>
              <Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
            </div>
            <div>
              <Label>Website (optional)</Label>
              <Input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
            </div>
            {error && <p className="text-sm text-[#dc2626]">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
