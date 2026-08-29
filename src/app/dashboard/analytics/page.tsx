"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface FunnelData {
  funnel: Record<string, number>;
  by_category: { name: string; count: number }[];
  by_province: { province: string; count: number }[];
  last_7_days: { day: string; count: number }[];
  revenue: { total_charged: number; total_deposits: number };
}

const FUNNEL_STEPS = [
  { key: "total", label: "Total enquiries" },
  { key: "new", label: "New" },
  { key: "verified", label: "Verified" },
  { key: "qualified", label: "Qualified" },
  { key: "delivered", label: "Delivered" },
  { key: "contacted", label: "Contacted" },
  { key: "converted", label: "Converted" },
  { key: "rejected", label: "Rejected" },
];

function BarChart({ items, labelKey, valueKey, maxBars = 8 }: {
  items: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  maxBars?: number;
}) {
  const slice = items.slice(0, maxBars);
  const max = Math.max(...slice.map((i) => Number(i[valueKey]) || 0), 1);

  return (
    <div className="space-y-3">
      {slice.map((item, idx) => {
        const value = Number(item[valueKey]) || 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div key={idx}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-[#bdbdbd]">{String(item[labelKey])}</span>
              <span className="text-white font-medium">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-[#262626]">
              <div className="h-2 rounded-full bg-[#dc2626]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/analytics/funnel");
      if (!res.ok) {
        setError("Could not load analytics");
        setLoading(false);
        return;
      }
      setData(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  const maxFunnel = data ? Math.max(...FUNNEL_STEPS.map((s) => data.funnel[s.key] ?? 0), 1) : 1;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-[#8c8c8c]">Lead funnel, geography, and revenue performance</p>
        </div>

        {loading ? (
          <p className="text-[#8c8c8c]">Loading analytics...</p>
        ) : error ? (
          <p className="text-[#dc2626]">{error}</p>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Total charged</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(data.revenue.total_charged)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Partner deposits</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(data.revenue.total_deposits)}</p></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Lead funnel</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {FUNNEL_STEPS.map((step) => {
                    const value = data.funnel[step.key] ?? 0;
                    const pct = Math.round((value / maxFunnel) * 100);
                    return (
                      <div key={step.key}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-[#bdbdbd]">{step.label}</span>
                          <span className="font-medium text-white">{value}</span>
                        </div>
                        <div className="h-3 rounded-full bg-[#262626]">
                          <div className="h-3 rounded-full bg-[#dc2626]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>By category</CardTitle></CardHeader>
                <CardContent>
                  <BarChart items={data.by_category} labelKey="name" valueKey="count" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>By province</CardTitle></CardHeader>
                <CardContent>
                  <BarChart items={data.by_province} labelKey="province" valueKey="count" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Last 7 days</CardTitle></CardHeader>
              <CardContent>
                {data.last_7_days.length === 0 ? (
                  <p className="text-sm text-[#8c8c8c]">No enquiries in the last 7 days</p>
                ) : (
                  <div className="flex items-end gap-2 h-40">
                    {data.last_7_days.map((d) => {
                      const maxDay = Math.max(...data.last_7_days.map((x) => x.count), 1);
                      const height = Math.max(8, (d.count / maxDay) * 100);
                      return (
                        <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                          <span className="text-xs text-white">{d.count}</span>
                          <div className="w-full rounded-t bg-[#dc2626]" style={{ height: `${height}%` }} />
                          <span className="text-[10px] text-[#8c8c8c]">{d.day.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}
