"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { formatDate, LEAD_STATUS_LABELS, SA_PROVINCES } from "@/lib/utils";
import type { ConnectLead } from "@/lib/types";
import { Download, Search } from "lucide-react";

const STATUS_OPTIONS = Object.keys(LEAD_STATUS_LABELS);

export default function LeadsPage() {
  const [leads, setLeads] = useState<ConnectLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("connect_leads")
      .select("*, connect_lead_categories(name, slug)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter) query = query.eq("status", statusFilter);
    if (provinceFilter) query = query.eq("province", provinceFilter);
    if (search.trim()) {
      const q = search.trim();
      query = query.or(`lead_reference.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    }

    const { data } = await query;
    setLeads((data ?? []) as ConnectLead[]);
    setLoading(false);
  }, [search, statusFilter, provinceFilter]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (provinceFilter) params.set("province", provinceFilter);
    if (search.trim()) params.set("q", search.trim());
    window.location.href = `/api/leads/export?${params.toString()}`;
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Leads</h2>
            <p className="text-[#8c8c8c]">Search, filter, and export financial help enquiries</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button asChild variant="outline">
              <Link href="/apply" target="_blank">Open public form</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c8c8c]" />
            <Input
              className="pl-9"
              placeholder="Search reference, name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="min-h-[44px] rounded-md border border-[#262626] bg-[#111] px-3 text-sm text-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
          <select
            className="min-h-[44px] rounded-md border border-[#262626] bg-[#111] px-3 text-sm text-white"
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
          >
            <option value="">All provinces</option>
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <p className="text-sm text-[#8c8c8c]">{loading ? "Loading..." : `${leads.length} leads shown`}</p>

        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#111] text-left text-[#8c8c8c]">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Province</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {!loading && leads.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#8c8c8c]">No leads match your filters</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-[#262626]">
                    <td className="px-4 py-3 font-mono text-white">{lead.lead_reference}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{lead.first_name} {lead.last_name}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">
                      {(lead as ConnectLead & { connect_lead_categories?: { name: string } }).connect_lead_categories?.name}
                    </td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{lead.province}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{lead.lead_score}</td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3 text-[#8c8c8c]">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/leads/${lead.id}`} className="text-[#dc2626] hover:underline">View</Link>
                    </td>
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
