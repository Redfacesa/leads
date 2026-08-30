"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BRAND } from "@/lib/branding";

interface TxRow {
  type: string;
  amount: number;
  reference: string | null;
  created_at: string;
}

export default function ClientBillingPage() {
  const [balance, setBalance] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [status, setStatus] = useState("active");
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: profile } = await supabase.from("connect_profiles").select("partner_id").maybeSingle();
      if (!profile?.partner_id) {
        setLoading(false);
        return;
      }

      const { data: account } = await supabase
        .from("connect_billing_accounts")
        .select("*")
        .eq("partner_id", profile.partner_id)
        .maybeSingle();

      if (account) {
        setBalance(Number(account.balance));
        setCreditLimit(Number(account.credit_limit));
        setStatus(account.status);

        const { data: tx } = await supabase
          .from("connect_billing_transactions")
          .select("type, amount, reference, created_at")
          .eq("billing_account_id", account.id)
          .order("created_at", { ascending: false })
          .limit(25);

        setTransactions((tx ?? []) as TxRow[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-[#8c8c8c]">Loading billing...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Billing & credits</h2>
        <p className="text-[#8c8c8c]">Wallet balance for lead purchases and delivery</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Lead balance</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(balance)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Credit limit</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(creditLimit)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Account</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold capitalize text-white">{status}</p></CardContent>
        </Card>
      </div>

      {balance + creditLimit < 100 && (
        <div className="rounded-lg border border-[#dc2626]/40 bg-[#1a1a1a] p-4">
          <p className="text-sm text-white">Low lead balance</p>
          <p className="mt-1 text-sm text-[#bdbdbd]">
            Contact {BRAND.supportEmail} to top up. Marketplace purchases pause when balance is insufficient.
          </p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Transaction history</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-[#8c8c8c]">No transactions yet</p>
          ) : (
            <div className="divide-y divide-[#262626]">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="text-white capitalize">{tx.type.replace("_", " ")}</p>
                    <p className="text-xs text-[#8c8c8c]">{tx.reference ?? "—"} · {formatDate(tx.created_at)}</p>
                  </div>
                  <p className={`font-medium ${tx.type === "lead_charge" ? "text-[#dc2626]" : "text-green-400"}`}>
                    {tx.type === "lead_charge" ? "−" : "+"}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
