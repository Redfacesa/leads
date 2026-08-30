"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { relationOne } from "@/lib/supabase/relations";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ListingRow {
  id: string;
  lead_id: string;
  price: number;
  status: string;
  preview_province: string | null;
  listed_at: string;
  categoryName: string | null;
  leadReference: string | null;
}

export default function AdminMarketplacePage() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [leadId, setLeadId] = useState("");
  const [price, setPrice] = useState("150");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("connect_marketplace_listings")
      .select("*, connect_lead_categories(name), connect_leads(lead_reference)")
      .order("listed_at", { ascending: false })
      .limit(50);
    setListings(
      (data ?? []).map((row) => ({
        id: row.id,
        lead_id: row.lead_id,
        price: Number(row.price),
        status: row.status,
        preview_province: row.preview_province,
        listed_at: row.listed_at,
        categoryName: relationOne(
          (row as { connect_lead_categories?: { name: string } | { name: string }[] }).connect_lead_categories
        )?.name ?? null,
        leadReference: relationOne(
          (row as { connect_leads?: { lead_reference: string } | { lead_reference: string }[] }).connect_leads
        )?.lead_reference ?? null,
      }))
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function listLead(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/marketplace/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, price: Number(price) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed to list lead");
      return;
    }
    setMessage("Lead listed on marketplace");
    setLeadId("");
    load();
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Marketplace inventory</h2>
          <p className="text-[#8c8c8c]">List qualified leads for client self-serve purchase</p>
        </div>

        <Card>
          <CardHeader><CardTitle>List a lead</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={listLead} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-sm text-[#8c8c8c]">Lead UUID</label>
                <Input value={leadId} onChange={(e) => setLeadId(e.target.value)} placeholder="From lead detail URL" required />
              </div>
              <div className="w-32">
                <label className="text-sm text-[#8c8c8c]">Price (ZAR)</label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <Button type="submit">List on marketplace</Button>
            </form>
            {message && <p className="mt-3 text-sm text-[#bdbdbd]">{message}</p>}
          </CardContent>
        </Card>

        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#111] text-left text-[#8c8c8c]">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Province</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Listed</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[#8c8c8c]">No marketplace listings yet</td></tr>
              ) : (
                listings.map((row) => (
                  <tr key={row.id} className="border-t border-[#262626]">
                    <td className="px-4 py-3 font-mono text-white">{row.leadReference ?? row.lead_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{row.categoryName}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{row.preview_province}</td>
                    <td className="px-4 py-3 text-white">{formatCurrency(Number(row.price))}</td>
                    <td className="px-4 py-3 capitalize text-[#bdbdbd]">{row.status}</td>
                    <td className="px-4 py-3 text-[#8c8c8c]">{formatDate(row.listed_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
