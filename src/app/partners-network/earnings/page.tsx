"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { relationOne } from "@/lib/supabase/relations";

type Commission = {
  id: string;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
  connect_leads?: { lead_reference: string } | { lead_reference: string }[];
};

export default function LeadPartnerEarningsPage() {
  const [balance, setBalance] = useState(0);
  const [rate, setRate] = useState(0);
  const [rows, setRows] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("connect_profiles")
        .select("lead_partner_id")
        .maybeSingle();

      if (!profile?.lead_partner_id) {
        setLoading(false);
        return;
      }

      const { data: org } = await supabase
        .from("connect_lead_partners")
        .select("status, earnings_balance, commission_rate")
        .eq("id", profile.lead_partner_id)
        .maybeSingle();

      if (org?.status !== "active") {
        setLoading(false);
        return;
      }
      setHasAccess(true);
      setBalance(Number(org.earnings_balance));
      setRate(Number(org.commission_rate));

      const { data } = await supabase
        .from("connect_lead_partner_commissions")
        .select("id, sale_amount, commission_rate, commission_amount, status, created_at, connect_leads(lead_reference)")
        .eq("lead_partner_id", profile.lead_partner_id)
        .order("created_at", { ascending: false })
        .limit(50);

      setRows((data ?? []) as Commission[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-[#8c8c8c]">Loading earnings...</p>;

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-[#bdbdbd]">Partner access required.</p>
          <Button asChild className="mt-4"><Link href="/partners-network/apply">Apply now</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Earnings</h2>
        <p className="text-[#8c8c8c]">Commission paid when your accepted leads are sold to clients</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Wallet balance</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(balance)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Commission rate</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{(rate * 100).toFixed(0)}%</p></CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#262626]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#111] text-left text-[#8c8c8c]">
            <tr>
              <th className="px-4 py-3">Lead ref</th>
              <th className="px-4 py-3">Sale</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#8c8c8c]">No commissions yet</td>
              </tr>
            ) : (
              rows.map((row) => {
                const lead = relationOne(row.connect_leads);
                return (
                  <tr key={row.id} className="border-t border-[#262626]">
                    <td className="px-4 py-3 text-white">{lead?.lead_reference ?? "—"}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{formatCurrency(Number(row.sale_amount))}</td>
                    <td className="px-4 py-3 text-emerald-400">{formatCurrency(Number(row.commission_amount))}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{row.status}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{formatDate(row.created_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#666]">Payout requests and bank details will be added in a future release.</p>
    </div>
  );
}
