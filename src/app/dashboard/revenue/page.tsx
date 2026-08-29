"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function RevenuePage() {
  const [totals, setTotals] = useState({ delivered: 0, revenue: 0 });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("connect_lead_assignments")
        .select("price, status");
      const delivered = (data ?? []).filter((a) => a.status === "delivered").length;
      const revenue = (data ?? []).reduce((sum, a) => sum + Number(a.price ?? 0), 0);
      setTotals({ delivered, revenue });
    }
    load();
  }, []);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Revenue</h2>
          <p className="text-[#8c8c8c]">Lead delivery billing (v0.1 manual charges)</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Delivered leads</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{totals.delivered}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Recorded lead value</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(totals.revenue)}</p></CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
