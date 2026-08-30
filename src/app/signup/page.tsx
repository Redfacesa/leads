"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/branding";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"account" | "business">("account");
  const [account, setAccount] = useState({ email: "", password: "", fullName: "" });
  const [business, setBusiness] = useState({
    business_name: "",
    phone: "",
    registration_number: "",
    website: "",
    partner_type: "financial_services",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createAccount(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: { data: { full_name: account.fullName } },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setStep("business");
  }

  async function submitApplication(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/partner/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...business, email: account.email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Application failed");
      return;
    }

    router.push("/client");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{BRAND.name} — Partner registration</CardTitle>
          <CardDescription>
            {step === "account" ? "Create your account" : "Tell us about your business"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "account" ? (
            <form onSubmit={createAccount} className="space-y-4">
              <div>
                <Label>Full name</Label>
                <Input value={account.fullName} onChange={(e) => setAccount({ ...account, fullName: e.target.value })} required />
              </div>
              <div>
                <Label>Work email</Label>
                <Input type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} required />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" minLength={8} value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} required />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Continue"}
              </Button>
            </form>
          ) : (
            <form onSubmit={submitApplication} className="space-y-4">
              <div>
                <Label>Business name</Label>
                <Input value={business.business_name} onChange={(e) => setBusiness({ ...business, business_name: e.target.value })} required />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} />
              </div>
              <div>
                <Label>NCR / FSP registration</Label>
                <Input value={business.registration_number} onChange={(e) => setBusiness({ ...business, registration_number: e.target.value })} />
              </div>
              <div>
                <Label>Website (optional)</Label>
                <Input type="url" value={business.website} onChange={(e) => setBusiness({ ...business, website: e.target.value })} placeholder="https://" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit application"}
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-[#8c8c8c]">
            Already registered?{" "}
            <Link href="/login?next=/partner" className="text-[#dc2626] hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
