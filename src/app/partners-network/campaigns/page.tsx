"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { relationOne } from "@/lib/supabase/relations";

type Campaign = {
  id: string;
  name: string;
  active: boolean;
  daily_cap: number | null;
  created_at: string;
  connect_lead_categories?: { name: string } | { name: string }[];
};

export default function LeadPartnerCampaignsPage() {
  const [rows, setRows] = useState<Campaign[]>([]);
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
        .from("connect_lead_partner_campaigns")
        .select("id, name, active, daily_cap, created_at, connect_lead_categories(name)")
        .eq("lead_partner_id", profile.lead_partner_id)
        .order("created_at", { ascending: false });

      setRows((data ?? []) as Campaign[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-[#8c8c8c]">Loading campaigns...</p>;

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
      <div>
        <h2 className="text-2xl font-bold text-white">Campaigns</h2>
        <p className="text-[#8c8c8c]">Approved campaigns assigned to your partner account by Red Leads admin</p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-[#bdbdbd]">
            No campaigns assigned yet. Contact admin to register a campaign before high-volume submission.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#111] text-left text-[#8c8c8c]">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Daily cap</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const category = relationOne(row.connect_lead_categories);
                return (
                  <tr key={row.id} className="border-t border-[#262626]">
                    <td className="px-4 py-3 text-white">{row.name}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{row.daily_cap ?? "No cap"}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{row.active ? "Active" : "Paused"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
