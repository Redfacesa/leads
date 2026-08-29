"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { ConnectLead } from "@/lib/types";

export default function PartnerLeadsPage() {
  const [leads, setLeads] = useState<ConnectLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("connect_leads")
        .select("*, connect_lead_categories(name, slug)")
        .order("created_at", { ascending: false });
      setLeads((data ?? []) as ConnectLead[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">My leads</h2>
        <p className="text-[#8c8c8c]">Enquiries assigned to your organisation</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#262626]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#111] text-left text-[#8c8c8c]">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Province</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#8c8c8c]">Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#8c8c8c]">No assigned leads yet</td></tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-t border-[#262626]">
                  <td className="px-4 py-3 font-mono text-white">{lead.lead_reference}</td>
                  <td className="px-4 py-3 text-[#bdbdbd]">
                    {(lead as ConnectLead & { connect_lead_categories?: { name: string } }).connect_lead_categories?.name}
                  </td>
                  <td className="px-4 py-3 text-[#bdbdbd]">{lead.province}</td>
                  <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3 text-[#8c8c8c]">{formatDate(lead.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/partner/leads/${lead.id}`} className="text-[#dc2626] hover:underline">Open</Link>
                  </td>
                </tr>
              ))
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
