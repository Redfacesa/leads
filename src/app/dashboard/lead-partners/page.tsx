"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type LeadPartner = {
  id: string;
  business_name: string;
  email: string;
  phone: string | null;
  channels: string[];
  status: string;
  verification_status: string;
  commission_rate: number;
  earnings_balance: number;
  created_at: string;
};

export default function LeadPartnersAdminPage() {
  const [partners, setPartners] = useState<LeadPartner[]>([]);
  const [editingRate, setEditingRate] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/lead-partners");
    const data = await res.json();
    setPartners(data.partners ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function patchPartner(id: string, updates: Record<string, unknown>) {
    await fetch("/api/lead-partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadPartnerId: id, ...updates }),
    });
    load();
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Lead partners</h2>
          <p className="text-[#8c8c8c]">Agencies and marketers who submit leads for quality review</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#111] text-left text-[#8c8c8c]">
              <tr>
                <th className="px-4 py-3">Agency</th>
                <th className="px-4 py-3">Channels</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Earned</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#8c8c8c]">No lead partner applications yet</td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="border-t border-[#262626]">
                    <td className="px-4 py-3 text-white">
                      {p.business_name}
                      <span className="block text-xs text-[#666]">{p.email}</span>
                    </td>
                    <td className="px-4 py-3 text-[#bdbdbd] max-w-[140px] truncate">
                      {(p.channels ?? []).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.verification_status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          className="w-20"
                          value={editingRate[p.id] ?? String(p.commission_rate)}
                          onChange={(e) => setEditingRate({ ...editingRate, [p.id]: e.target.value })}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => patchPartner(p.id, { commission_rate: Number(editingRate[p.id] ?? p.commission_rate) })}
                        >
                          Set
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{formatCurrency(Number(p.earnings_balance))}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {p.status === "pending" && (
                          <Button size="sm" onClick={() => patchPartner(p.id, { status: "active", verification_status: "verified" })}>
                            Approve
                          </Button>
                        )}
                        {p.status === "active" && (
                          <Button size="sm" variant="outline" onClick={() => patchPartner(p.id, { status: "suspended" })}>
                            Suspend
                          </Button>
                        )}
                        {p.status === "suspended" && (
                          <Button size="sm" onClick={() => patchPartner(p.id, { status: "active" })}>
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <CardNote />
      </div>
    </DashboardShell>
  );
}

function CardNote() {
  return (
    <div className="rounded-lg border border-[#262626] bg-[#111] p-4 text-sm text-[#bdbdbd]">
      <Label className="text-white">Assign campaigns</Label>
      <p className="mt-1">Use Supabase admin or a future UI to insert rows in connect_lead_partner_campaigns for approved partners.</p>
    </div>
  );
}
