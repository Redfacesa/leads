"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils";

type OrgState = {
  id: string;
  business_name: string;
  status: string;
  verification_status: string;
  commission_rate: number;
  earnings_balance: number;
} | null;

export default function LeadPartnerOverviewPage() {
  const [org, setOrg] = useState<OrgState | null>(null);
  const [stats, setStats] = useState({ pending: 0, accepted: 0, rejected: 0, commissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("connect_profiles")
        .select("lead_partner_id")
        .maybeSingle();

      if (!profile?.lead_partner_id) {
        setOrg(null);
        setLoading(false);
        return;
      }

      const { data: partner } = await supabase
        .from("connect_lead_partners")
        .select("id, business_name, status, verification_status, commission_rate, earnings_balance")
        .eq("id", profile.lead_partner_id)
        .maybeSingle();

      setOrg(partner as OrgState);

      if (partner?.status === "active") {
        const [{ data: subs }, { data: comms }] = await Promise.all([
          supabase
            .from("connect_lead_partner_submissions")
            .select("status")
            .eq("lead_partner_id", profile.lead_partner_id),
          supabase
            .from("connect_lead_partner_commissions")
            .select("commission_amount")
            .eq("lead_partner_id", profile.lead_partner_id)
            .eq("status", "paid"),
        ]);

        const statuses = (subs ?? []).map((s) => s.status);
        setStats({
          pending: statuses.filter((s) => s === "pending_review").length,
          accepted: statuses.filter((s) => s === "accepted").length,
          rejected: statuses.filter((s) => s === "rejected" || s === "duplicate").length,
          commissions: (comms ?? []).reduce((sum, c) => sum + Number(c.commission_amount), 0),
        });
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-[#8c8c8c]">Loading partner account...</p>;
  }

  if (!org) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Lead Partner Network</h2>
          <p className="text-[#8c8c8c]">Submit qualified leads and earn commission when they sell</p>
        </div>
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-[#bdbdbd]">
              Apply to join as an approved agency or marketer. All submissions pass Red Leads quality and POPIA checks before entering inventory.
            </p>
            <Button asChild>
              <Link href="/partners-network/apply">Apply to become a partner</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (org.status === "pending") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{org.business_name}</h2>
          <p className="text-[#8c8c8c]">Application under review</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <StatusBadge status="pending_review" />
            <p className="mt-4 text-[#bdbdbd]">
              We are reviewing your agency profile and compliance details. You will be able to submit leads once approved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (org.status !== "active") {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">{org.business_name}</h2>
        <Card>
          <CardContent className="py-8 text-center">
            <StatusBadge status={org.status} />
            <p className="mt-4 text-[#bdbdbd]">
              Your partner account is not active. Contact Red Leads support if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Welcome, {org.business_name}</h2>
        <p className="text-[#8c8c8c]">
          Commission rate: {(Number(org.commission_rate) * 100).toFixed(0)}% on each lead sale
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">In review</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.pending}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Accepted</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.accepted}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Rejected</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.rejected}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Total earned</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(stats.commissions)}</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild><Link href="/partners-network/submit">Submit a lead</Link></Button>
        <Button asChild variant="outline"><Link href="/partners-network/submissions">My submissions</Link></Button>
        <Button asChild variant="outline"><Link href="/partners-network/earnings">Earnings</Link></Button>
      </div>

      <Card>
        <CardContent className="py-4 text-sm text-[#bdbdbd]">
          Wallet balance: <span className="font-semibold text-white">{formatCurrency(Number(org.earnings_balance))}</span>
          {" · "}
          Only submit leads where you have documented first-party consent.
        </CardContent>
      </Card>
    </div>
  );
}
