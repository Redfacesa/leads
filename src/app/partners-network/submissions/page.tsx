"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { relationOne } from "@/lib/supabase/relations";

type Submission = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  province: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  connect_lead_categories?: { name: string } | { name: string }[];
};

export default function LeadPartnerSubmissionsPage() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("connect_profiles")
        .select("lead_partner_id")
        .maybeSingle();

      if (!profile?.lead_partner_id) {
        setLoading(false);
        return;
      }

      const { data: org } = await supabase
        .from("connect_lead_partners")
        .select("status")
        .eq("id", profile.lead_partner_id)
        .maybeSingle();

      if (org?.status !== "active") {
        setLoading(false);
        return;
      }
      setHasAccess(true);

      const { data } = await supabase
        .from("connect_lead_partner_submissions")
        .select("id, first_name, last_name, phone, province, status, rejection_reason, created_at, connect_lead_categories(name)")
        .eq("lead_partner_id", profile.lead_partner_id)
        .order("created_at", { ascending: false })
        .limit(100);

      setRows((data ?? []) as Submission[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-[#8c8c8c]">Loading submissions...</p>;

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-[#bdbdbd]">Partner access required.</p>
          <Button asChild className="mt-4"><Link href="/partners-network/apply">Apply now</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">My submissions</h2>
          <p className="text-[#8c8c8c]">Track quality review status for leads you submitted</p>
        </div>
        <Button asChild><Link href="/partners-network/submit">Submit new lead</Link></Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#262626]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#111] text-left text-[#8c8c8c]">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Province</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#8c8c8c]">No submissions yet</td>
              </tr>
            ) : (
              rows.map((row) => {
                const category = relationOne(row.connect_lead_categories);
                return (
                  <tr key={row.id} className="border-t border-[#262626]">
                    <td className="px-4 py-3 text-white">
                      {row.first_name} {row.last_name}
                      <span className="block text-xs text-[#666]">{row.phone}</span>
                      {row.rejection_reason && (
                        <span className="block text-xs text-[#dc2626]">{row.rejection_reason}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{row.province}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{formatDate(row.created_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
