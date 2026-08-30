"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderRow {
  id: string;
  price: number;
  exclusive: boolean;
  payment_status: string;
  purchased_at: string;
  connect_leads?: { lead_reference: string };
  connect_partners?: { business_name: string };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("connect_lead_orders")
        .select("*, connect_leads(lead_reference), connect_partners(business_name)")
        .order("purchased_at", { ascending: false })
        .limit(100);
      setOrders((data ?? []) as OrderRow[]);
    }
    load();
  }, []);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Lead orders</h2>
          <p className="text-[#8c8c8c]">Marketplace purchases and delivery records</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#111] text-left text-[#8c8c8c]">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Exclusive</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Purchased</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[#8c8c8c]">No orders yet</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-t border-[#262626]">
                    <td className="px-4 py-3 font-mono text-white">{o.connect_leads?.lead_reference}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{o.connect_partners?.business_name}</td>
                    <td className="px-4 py-3 text-white">{formatCurrency(Number(o.price))}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{o.exclusive ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 capitalize text-[#bdbdbd]">{o.payment_status}</td>
                    <td className="px-4 py-3 text-[#8c8c8c]">{formatDate(o.purchased_at)}</td>
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
