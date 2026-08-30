"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, LEAD_STATUS_LABELS } from "@/lib/utils";
import type { ConnectLead } from "@/lib/types";
import { Search } from "lucide-react";

type LeadRow = ConnectLead & {
  connect_lead_categories?: { name: string };
  connect_lead_assignments?: { delivered_at: string | null }[];
};

export default function PartnerLeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("connect_leads")
      .select("*, connect_lead_categories(name), connect_lead_assignments(delivered_at)")
      .order("created_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);
    if (search.trim()) {
      const q = search.trim();
      query = query.or(`lead_reference.ilike.%${q}%,phone.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    }

    const { data } = await query;
    setLeads((data ?? []) as LeadRow[]);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">My leads</h2>
        <p className="text-[#8c8c8c]">Enquiries assigned to your organisation</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c8c8c]" />
          <Input className="pl-9" placeholder="Search reference, name, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          className="min-h-[44px] rounded-md border border-[#262626] bg-[#111] px-3 text-sm text-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#262626]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#111] text-left text-[#8c8c8c]">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Province</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Delivered</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#8c8c8c]">Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#8c8c8c]">No assigned leads yet</td></tr>
            ) : (
              leads.map((lead) => {
                const deliveredAt = lead.connect_lead_assignments?.[0]?.delivered_at;
                return (
                  <tr key={lead.id} className="border-t border-[#262626]">
                    <td className="px-4 py-3 font-mono text-white">{lead.lead_reference}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{lead.first_name} {lead.last_name}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{lead.connect_lead_categories?.name}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{lead.province}</td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3 text-[#8c8c8c]">{deliveredAt ? formatDate(deliveredAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/partner/leads/${lead.id}`} className="text-[#dc2626] hover:underline">Open</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Button asChild variant="outline">
        <Link href="/partner">Back to overview</Link>
      </Button>
    </div>
  );
}
