"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function PartnerPortalPage() {
  const [stats, setStats] = useState({ total: 0, needsContact: 0, converted: 0, balance: 0 });
  const [hasPartner, setHasPartner] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: profile } = await supabase.from("connect_profiles").select("partner_id").maybeSingle();

      if (!profile?.partner_id) {
        setHasPartner(false);
        return;
      }
      setHasPartner(true);

      const [{ data: assignments }, { data: account }] = await Promise.all([
        supabase
          .from("connect_lead_assignments")
          .select("status, connect_leads(status)")
          .eq("partner_id", profile.partner_id),
        supabase
          .from("connect_billing_accounts")
          .select("balance")
          .eq("partner_id", profile.partner_id)
          .maybeSingle(),
      ]);

      const rows = (assignments ?? []) as { status: string; connect_leads?: { status: string } | { status: string }[] }[];
      const leadStatuses = rows.map((r) => {
        const lead = r.connect_leads;
        return Array.isArray(lead) ? lead[0]?.status : lead?.status;
      });

      setStats({
        total: rows.length,
        needsContact: leadStatuses.filter((s) => s === "delivered" || s === "matched").length,
        converted: leadStatuses.filter((s) => s === "converted").length,
        balance: Number(account?.balance ?? 0),
      });
    }
    load();
  }, []);

  if (hasPartner === false) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Partner portal</h2>
          <p className="text-[#8c8c8c]">Your account is not linked to a partner organisation yet</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-[#bdbdbd]">Apply to become a RedFace Connect partner to receive qualified enquiries.</p>
            <Button asChild className="mt-4">
              <Link href="/partner/apply">Apply now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Partner overview</h2>
        <p className="text-[#8c8c8c]">Leads assigned to your organisation</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Assigned leads</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Needs contact</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.needsContact}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Converted</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.converted}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Wallet balance</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(stats.balance)}</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/partner/leads">View my leads</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/partner/billing">Billing</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/partner/webhooks">Webhooks</Link>
        </Button>
      </div>
    </div>
  );
}
