"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { relationOne } from "@/lib/supabase/relations";
import type { ConnectPartner } from "@/lib/types";

interface WalletRow {
  partner_id: string;
  balance: number;
  credit_limit: number;
  status: string;
  connect_partners?: { business_name: string } | null;
}

interface TxRow {
  type: string;
  amount: number;
  reference: string | null;
  created_at: string;
}

export default function RevenuePage() {
  const [totals, setTotals] = useState({ delivered: 0, revenue: 0, deposits: 0, charged: 0 });
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [partners, setPartners] = useState<ConnectPartner[]>([]);
  const [depositForm, setDepositForm] = useState({ partnerId: "", amount: "", reference: "" });
  const [depositing, setDepositing] = useState(false);
  const [recentTx, setRecentTx] = useState<TxRow[]>([]);

  async function load() {
    const supabase = createClient();

    const [{ data: assignments }, { data: accounts }, { data: partnerList }, { data: tx }] = await Promise.all([
      supabase.from("connect_lead_assignments").select("price, status"),
      supabase.from("connect_billing_accounts").select("partner_id, balance, credit_limit, status, connect_partners(business_name)"),
      supabase.from("connect_partners").select("*").eq("status", "active").order("business_name"),
      supabase.from("connect_billing_transactions").select("type, amount, reference, created_at").order("created_at", { ascending: false }).limit(15),
    ]);

    const rows = (assignments ?? []) as { price: number | null; status: string }[];
    const delivered = rows.filter((row) => row.status === "delivered").length;
    const revenue = rows.reduce((sum, row) => sum + Number(row.price ?? 0), 0);

    const transactions = (tx ?? []) as TxRow[];
    const deposits = transactions.filter((t) => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
    const charged = transactions.filter((t) => t.type === "lead_charge").reduce((s, t) => s + Number(t.amount), 0);

    setTotals({ delivered, revenue, deposits, charged });
    setWallets(
      (accounts ?? []).map((row) => ({
        partner_id: row.partner_id,
        balance: Number(row.balance),
        credit_limit: Number(row.credit_limit),
        status: row.status,
        connect_partners: relationOne(
          (row as { connect_partners?: { business_name: string } | { business_name: string }[] }).connect_partners
        ),
      }))
    );
    setPartners((partnerList ?? []) as ConnectPartner[]);
    setRecentTx(transactions);
  }

  useEffect(() => {
    load();
  }, []);

  async function deposit(e: FormEvent) {
    e.preventDefault();
    if (!depositForm.partnerId || !depositForm.amount) return;
    setDepositing(true);
    await fetch("/api/billing/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId: depositForm.partnerId,
        amount: Number(depositForm.amount),
        reference: depositForm.reference || undefined,
      }),
    });
    setDepositForm({ partnerId: "", amount: "", reference: "" });
    setDepositing(false);
    load();
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Revenue & billing</h2>
          <p className="text-[#8c8c8c]">Lead delivery charges and partner wallet balances</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Delivered leads</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{totals.delivered}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Lead value</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(totals.revenue)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Wallet charges</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(totals.charged)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Deposits</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(totals.deposits)}</p></CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Deposit to partner wallet</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={deposit} className="space-y-4">
                <div>
                  <Label>Partner</Label>
                  <select
                    className="mt-1 w-full min-h-[44px] rounded-md border border-[#262626] bg-[#0a0a0a] px-3 text-sm text-white"
                    value={depositForm.partnerId}
                    onChange={(e) => setDepositForm({ ...depositForm, partnerId: e.target.value })}
                    required
                  >
                    <option value="">Select partner</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.business_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Amount (ZAR)</Label>
                  <Input type="number" min="1" step="0.01" value={depositForm.amount} onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })} required />
                </div>
                <div>
                  <Label>Reference (optional)</Label>
                  <Input value={depositForm.reference} onChange={(e) => setDepositForm({ ...depositForm, reference: e.target.value })} placeholder="EFT reference" />
                </div>
                <Button type="submit" disabled={depositing}>{depositing ? "Processing..." : "Add deposit"}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
            <CardContent>
              {recentTx.length === 0 ? (
                <p className="text-sm text-[#8c8c8c]">No transactions yet</p>
              ) : (
                <div className="divide-y divide-[#262626]">
                  {recentTx.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <p className="text-white capitalize">{tx.type.replace("_", " ")}</p>
                        <p className="text-xs text-[#8c8c8c]">{tx.reference ?? "—"} · {formatDate(tx.created_at)}</p>
                      </div>
                      <p className="font-medium text-white">{formatCurrency(tx.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Partner wallet balances</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-[#8c8c8c]">
                  <tr>
                    <th className="pb-2 pr-4">Partner</th>
                    <th className="pb-2 pr-4">Balance</th>
                    <th className="pb-2 pr-4">Credit limit</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.length === 0 ? (
                    <tr><td colSpan={4} className="py-4 text-[#8c8c8c]">No billing accounts yet</td></tr>
                  ) : (
                    wallets.map((w) => (
                      <tr key={w.partner_id} className="border-t border-[#262626]">
                        <td className="py-3 text-white">{w.connect_partners?.business_name ?? w.partner_id}</td>
                        <td className="py-3 text-[#bdbdbd]">{formatCurrency(Number(w.balance))}</td>
                        <td className="py-3 text-[#bdbdbd]">{formatCurrency(Number(w.credit_limit))}</td>
                        <td className="py-3 text-[#bdbdbd] capitalize">{w.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
