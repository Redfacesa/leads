"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency, LEAD_STATUS_LABELS } from "@/lib/utils";
import type { ConnectLead, ConnectLeadAssignment, ConnectPartner } from "@/lib/types";

interface TimelineEntry {
  type: "status" | "audit";
  label: string;
  detail?: string;
  at: string;
}

interface WalletHint {
  partnerId: string;
  balance: number;
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<ConnectLead | null>(null);
  const [assignments, setAssignments] = useState<ConnectLeadAssignment[]>([]);
  const [partners, setPartners] = useState<ConnectPartner[]>([]);
  const [wallets, setWallets] = useState<WalletHint[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [consent, setConsent] = useState<{ consent_given: boolean; policy_version: string; created_at: string } | null>(null);
  const [partnerId, setPartnerId] = useState("");
  const [price, setPrice] = useState("100");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: leadData }, { data: assignData }, { data: partnerData }, { data: walletData }] = await Promise.all([
        supabase.from("connect_leads").select("*, connect_lead_categories(name, slug)").eq("id", params.id).maybeSingle(),
        supabase.from("connect_lead_assignments").select("*, connect_partners(business_name)").eq("lead_id", params.id),
        supabase.from("connect_partners").select("*").eq("status", "active").order("business_name"),
        supabase.from("connect_billing_accounts").select("partner_id, balance"),
      ]);

      setLead(leadData as ConnectLead | null);
      setAssignments((assignData ?? []) as ConnectLeadAssignment[]);
      setPartners((partnerData ?? []) as ConnectPartner[]);
      setWallets((walletData ?? []).map((w) => ({ partnerId: w.partner_id, balance: Number(w.balance) })));

      const tlRes = await fetch(`/api/leads/${params.id}/timeline`);
      if (tlRes.ok) {
        const tl = await tlRes.json();
        setConsent(tl.consent);
        const entries: TimelineEntry[] = [
          ...(tl.statusHistory ?? []).map((h: { new_status: string; old_status: string | null; reason: string | null; created_at: string }) => ({
            type: "status" as const,
            label: `${LEAD_STATUS_LABELS[h.old_status ?? ""] ?? h.old_status ?? "New"} → ${LEAD_STATUS_LABELS[h.new_status] ?? h.new_status}`,
            detail: h.reason ?? undefined,
            at: h.created_at,
          })),
          ...(tl.auditLog ?? []).map((a: { action: string; new_data: Record<string, unknown>; created_at: string }) => ({
            type: "audit" as const,
            label: a.action.replace(/\./g, " "),
            detail: a.new_data?.partner_name ? String(a.new_data.partner_name) : undefined,
            at: a.created_at,
          })),
        ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        setTimeline(entries);
      }

      setLoading(false);
    }
    load();
  }, [params.id]);

  const selectedWallet = wallets.find((w) => w.partnerId === partnerId);

  async function updateStatus(status: string) {
    await fetch("/api/leads/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: params.id, status }),
    });
    setLead((l) => (l ? { ...l, status: status as ConnectLead["status"] } : l));
    router.refresh();
  }

  async function assignPartner() {
    if (!partnerId) return;
    setAssigning(true);
    setAssignError(null);
    const res = await fetch("/api/leads/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: params.id, partnerId, price: Number(price) }),
    });
    const data = await res.json();
    setAssigning(false);
    if (!res.ok) {
      setAssignError(data.error ?? "Assignment failed");
      return;
    }
    window.location.reload();
  }

  async function runAutoMatch() {
    const res = await fetch("/api/matching/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: params.id }),
    });
    const data = await res.json();
    if (data.matched) {
      window.location.reload();
      return;
    }
    setAssignError(data.error ?? "No matching rule found for this lead.");
  }

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-[#8c8c8c]">Loading lead...</p>
      </DashboardShell>
    );
  }

  if (!lead) {
    return (
      <DashboardShell>
        <p className="text-[#8c8c8c]">Lead not found</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">{lead.lead_reference}</h2>
            <p className="text-[#8c8c8c]">
              {(lead as ConnectLead & { connect_lead_categories?: { name: string } }).connect_lead_categories?.name}
              {" · "}Submitted {formatDate(lead.created_at)}
            </p>
          </div>
          <StatusBadge status={lead.status} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-[#262626] bg-[#111] p-5 space-y-3">
            <h3 className="font-semibold text-white">Consumer</h3>
            <p className="text-sm text-[#bdbdbd]">Name: {lead.first_name} {lead.last_name}</p>
            <p className="text-sm text-[#bdbdbd]">Phone: <a href={`tel:${lead.phone}`} className="text-[#dc2626] hover:underline">{lead.phone}</a></p>
            {lead.email && <p className="text-sm text-[#bdbdbd]">Email: <a href={`mailto:${lead.email}`} className="text-[#dc2626] hover:underline">{lead.email}</a></p>}
            <p className="text-sm text-[#bdbdbd]">Province: {lead.province}{lead.city ? `, ${lead.city}` : ""}</p>
            {lead.employment_status && <p className="text-sm text-[#bdbdbd]">Employment: {lead.employment_status}</p>}
            {lead.income_band && <p className="text-sm text-[#bdbdbd]">Income: {lead.income_band}</p>}
            {lead.debt_band && <p className="text-sm text-[#bdbdbd]">Debt: {lead.debt_band}</p>}
            {lead.enquiry_reason && <p className="text-sm text-[#bdbdbd]">Reason: {lead.enquiry_reason}</p>}
            {consent && (
              <p className="text-xs text-[#8c8c8c] pt-2 border-t border-[#262626]">
                Consent recorded ({consent.policy_version}) · {formatDate(consent.created_at)}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-[#262626] bg-[#111] p-5 space-y-4">
            <h3 className="font-semibold text-white">Qualification</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-[#262626]">
                <div className="h-2 rounded-full bg-[#dc2626]" style={{ width: `${lead.lead_score}%` }} />
              </div>
              <span className="text-sm font-medium text-white">{lead.lead_score}/100</span>
            </div>
            <p className="text-sm text-[#8c8c8c]">Lead quality score, not a credit score.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => updateStatus("verified")}>Verify</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus("qualified")}>Mark qualified</Button>
              <Button size="sm" variant="outline" onClick={runAutoMatch}>Run auto-match</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus("rejected")}>Reject</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus("duplicate")}>Duplicate</Button>
            </div>

            {assignments.length === 0 && (
              <div className="border-t border-[#262626] pt-4 space-y-3">
                <h4 className="font-medium text-white">Assign partner manually</h4>
                <div>
                  <Label>Partner</Label>
                  <select
                    className="mt-1 flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm text-white"
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                  >
                    <option value="">Select partner</option>
                    {partners.map((p) => {
                      const bal = wallets.find((w) => w.partnerId === p.id)?.balance;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.business_name}{bal !== undefined ? ` (${formatCurrency(bal)})` : ""}
                        </option>
                      );
                    })}
                  </select>
                  {selectedWallet && Number(price) > selectedWallet.balance && (
                    <p className="mt-1 text-xs text-[#dc2626]">
                      Wallet balance {formatCurrency(selectedWallet.balance)} may be insufficient for R{price} delivery
                    </p>
                  )}
                </div>
                <div>
                  <Label>Lead price (ZAR)</Label>
                  <input
                    className="mt-1 flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm text-white"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                {assignError && <p className="text-sm text-[#dc2626]">{assignError}</p>}
                <Button onClick={assignPartner} disabled={!partnerId || assigning}>
                  {assigning ? "Assigning..." : "Assign and deliver"}
                </Button>
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-[#262626] bg-[#111] p-5">
            <h3 className="font-semibold text-white mb-3">Assignments</h3>
            {assignments.length === 0 ? (
              <p className="text-sm text-[#8c8c8c]">Not assigned yet</p>
            ) : (
              assignments.map((a) => (
                <div key={a.id} className="text-sm text-[#bdbdbd] py-2 border-t border-[#262626] first:border-0">
                  {(a as ConnectLeadAssignment & { connect_partners?: { business_name: string } }).connect_partners?.business_name}
                  {" · "}{formatCurrency(Number(a.price ?? 0))} · {a.status}
                  {a.delivered_at && ` · Delivered ${formatDate(a.delivered_at)}`}
                </div>
              ))
            )}
          </section>

          <section className="rounded-lg border border-[#262626] bg-[#111] p-5">
            <h3 className="font-semibold text-white mb-3">Activity timeline</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-[#8c8c8c]">No activity yet</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {timeline.map((entry, i) => (
                  <div key={i} className="text-sm border-l-2 border-[#262626] pl-3">
                    <p className="text-white capitalize">{entry.label}</p>
                    {entry.detail && <p className="text-[#8c8c8c]">{entry.detail}</p>}
                    <p className="text-xs text-[#8c8c8c]">{formatDate(entry.at)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
