"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function ClientDashboardPage() {
  const [stats, setStats] = useState({
    newLeads: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    balance: 0,
    orgName: "",
  });
  const [hasOrg, setHasOrg] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("connect_profiles")
        .select("partner_id, full_name")
        .maybeSingle();

      if (!profile?.partner_id) {
        setHasOrg(false);
        return;
      }
      setHasOrg(true);

      const { data: org } = await supabase
        .from("connect_partners")
        .select("business_name")
        .eq("id", profile.partner_id)
        .maybeSingle();

      const [{ data: assignments }, { data: account }] = await Promise.all([
        supabase
          .from("connect_lead_assignments")
          .select("connect_leads(status)")
          .eq("partner_id", profile.partner_id),
        supabase
          .from("connect_billing_accounts")
          .select("balance")
          .eq("partner_id", profile.partner_id)
          .maybeSingle(),
      ]);

      const statuses = ((assignments ?? []) as { connect_leads?: { status: string } | { status: string }[] }[])
        .map((a) => {
          const l = a.connect_leads;
          return Array.isArray(l) ? l[0]?.status : l?.status;
        })
        .filter(Boolean) as string[];

      setStats({
        newLeads: statuses.filter((s) => ["delivered", "sold", "matched", "new"].includes(s)).length,
        contacted: statuses.filter((s) => ["contacted", "in_progress"].includes(s)).length,
        qualified: statuses.filter((s) => s === "qualified").length,
        converted: statuses.filter((s) => s === "converted").length,
        balance: Number(account?.balance ?? 0),
        orgName: org?.business_name ?? profile.full_name ?? "Your business",
      });
    }
    load();
  }, []);

  if (hasOrg === false) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Welcome to Red Leads</h2>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-[#bdbdbd]">Create a client account to buy and manage leads from Red Leads campaigns.</p>
            <Button asChild className="mt-4">
              <Link href="/client/apply">Apply for access</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Welcome, {stats.orgName}</h2>
        <p className="text-[#8c8c8c]">Your lead pipeline at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">New leads</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.newLeads}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Contacted</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.contacted}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Qualified</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.qualified}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Converted</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.converted}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Lead balance</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(stats.balance)}</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild><Link href="/client/leads">My leads</Link></Button>
        <Button asChild variant="outline"><Link href="/client/marketplace">Browse marketplace</Link></Button>
        <Button asChild variant="outline"><Link href="/client/billing">Top up wallet</Link></Button>
      </div>
    </div>
  );
}
