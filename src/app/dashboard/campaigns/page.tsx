"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface CampaignStats {
  total: number;
  qualified: number;
  delivered: number;
  converted: number;
  conversionRate: number;
  costPerLead: number | null;
}

interface CampaignRow {
  id: string;
  name: string;
  platform: string | null;
  budget: number | null;
  spend: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  trackingUrl: string;
  stats: CampaignStats;
  connect_sources?: Array<{
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
  }>;
}

interface UnattributedStats extends CampaignStats {}

const PLATFORMS = ["facebook", "google", "tiktok", "whatsapp", "organic", "referral", "other"];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [unattributed, setUnattributed] = useState<UnattributedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    platform: "facebook",
    budget: "",
    spend: "",
    utm_source: "",
    utm_medium: "cpc",
    utm_campaign: "",
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns ?? []);
    setUnattributed(data.unattributed ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCampaign(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: "", platform: "facebook", budget: "", spend: "", utm_source: "", utm_medium: "cpc", utm_campaign: "" });
    load();
  }

  async function updateSpend(campaignId: string, spend: string) {
    await fetch("/api/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, spend: Number(spend) }),
    });
    load();
  }

  async function copyUrl(id: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const totals = campaigns.reduce(
    (acc, c) => ({
      leads: acc.leads + c.stats.total,
      spend: acc.spend + Number(c.spend ?? 0),
      converted: acc.converted + c.stats.converted,
    }),
    { leads: 0, spend: 0, converted: 0 }
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Campaigns</h2>
            <p className="text-[#8c8c8c]">Track acquisition sources and campaign performance</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ New campaign"}</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Campaign leads</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{totals.leads}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Total spend</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{formatCurrency(totals.spend)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Conversions</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{totals.converted}</p></CardContent>
          </Card>
        </div>

        {showForm && (
          <form onSubmit={createCampaign} className="rounded-lg border border-[#262626] bg-[#111] p-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Campaign name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Facebook debt assistance Gauteng" required />
            </div>
            <div>
              <Label>Platform</Label>
              <select className="mt-1 flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label>Budget (ZAR)</Label>
              <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div>
              <Label>UTM source</Label>
              <Input value={form.utm_source} onChange={(e) => setForm({ ...form, utm_source: e.target.value })} placeholder="facebook" />
            </div>
            <div>
              <Label>UTM medium</Label>
              <Input value={form.utm_medium} onChange={(e) => setForm({ ...form, utm_medium: e.target.value })} placeholder="cpc" />
            </div>
            <div className="sm:col-span-2">
              <Label>UTM campaign</Label>
              <Input value={form.utm_campaign} onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })} placeholder="debt_gauteng_q3" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Create campaign</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#111] text-left text-[#8c8c8c]">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">Qualified</th>
                <th className="px-4 py-3">Converted</th>
                <th className="px-4 py-3">Conv. rate</th>
                <th className="px-4 py-3">Spend</th>
                <th className="px-4 py-3">Cost / lead</th>
                <th className="px-4 py-3">Link</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-[#8c8c8c]">Loading...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-[#8c8c8c]">No campaigns yet. Create one to track UTM performance.</td></tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-t border-[#262626]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{campaign.name}</p>
                      <p className="text-xs text-[#8c8c8c]">
                        {campaign.connect_sources?.[0]?.utm_source ?? "—"} / {campaign.connect_sources?.[0]?.utm_campaign ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[#bdbdbd] capitalize">{campaign.platform ?? "—"}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{campaign.stats.total}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{campaign.stats.qualified}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{campaign.stats.converted}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{campaign.stats.conversionRate}%</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        className="h-9 w-28"
                        defaultValue={campaign.spend}
                        onBlur={(e) => updateSpend(campaign.id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 text-[#bdbdbd]">
                      {campaign.stats.costPerLead != null ? formatCurrency(campaign.stats.costPerLead) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => copyUrl(campaign.id, campaign.trackingUrl)}>
                        {copiedId === campaign.id ? "Copied" : "Copy URL"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {unattributed && unattributed.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unattributed leads</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#bdbdbd]">
              {unattributed.total} leads without a linked campaign (direct / organic / unknown UTM).
              {" "}{unattributed.converted} converted ({unattributed.total ? Math.round((unattributed.converted / unattributed.total) * 1000) / 10 : 0}%).
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
