"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { ConnectLead, ConnectLeadAssignment, ConnectPartner } from "@/lib/types";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<ConnectLead | null>(null);
  const [assignments, setAssignments] = useState<ConnectLeadAssignment[]>([]);
  const [partners, setPartners] = useState<ConnectPartner[]>([]);
  const [partnerId, setPartnerId] = useState("");
  const [price, setPrice] = useState("100");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: leadData }, { data: assignData }, { data: partnerData }] = await Promise.all([
        supabase.from("connect_leads").select("*, connect_lead_categories(name, slug)").eq("id", params.id).maybeSingle(),
        supabase.from("connect_lead_assignments").select("*, connect_partners(business_name)").eq("lead_id", params.id),
        supabase.from("connect_partners").select("*").eq("status", "active").order("business_name"),
      ]);
      setLead(leadData as ConnectLead | null);
      setAssignments((assignData ?? []) as ConnectLeadAssignment[]);
      setPartners((partnerData ?? []) as ConnectPartner[]);
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function updateStatus(status: string) {
    await fetch("/api/leads/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: params.id, status }),
    });
    router.refresh();
    setLead((l) => (l ? { ...l, status: status as ConnectLead["status"] } : l));
  }

  async function assignPartner() {
    if (!partnerId) return;
    await fetch("/api/leads/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: params.id, partnerId, price: Number(price) }),
    });
    router.refresh();
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
    alert("No matching rule found for this lead.");
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
            </p>
          </div>
          <StatusBadge status={lead.status} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-[#262626] bg-[#111] p-5 space-y-3">
            <h3 className="font-semibold text-white">Consumer</h3>
            <p className="text-sm text-[#bdbdbd]">Name: {lead.first_name} {lead.last_name}</p>
            <p className="text-sm text-[#bdbdbd]">Phone: {lead.phone}</p>
            {lead.email && <p className="text-sm text-[#bdbdbd]">Email: {lead.email}</p>}
            <p className="text-sm text-[#bdbdbd]">Province: {lead.province}{lead.city ? `, ${lead.city}` : ""}</p>
            {lead.employment_status && <p className="text-sm text-[#bdbdbd]">Employment: {lead.employment_status}</p>}
            {lead.income_band && <p className="text-sm text-[#bdbdbd]">Income: {lead.income_band}</p>}
            {lead.debt_band && <p className="text-sm text-[#bdbdbd]">Debt: {lead.debt_band}</p>}
            {lead.enquiry_reason && <p className="text-sm text-[#bdbdbd]">Reason: {lead.enquiry_reason}</p>}
          </section>

          <section className="rounded-lg border border-[#262626] bg-[#111] p-5 space-y-4">
            <h3 className="font-semibold text-white">Qualification</h3>
            <p className="text-sm text-[#bdbdbd]">Lead quality score: {lead.lead_score}/100</p>
            <p className="text-sm text-[#8c8c8c]">This is a lead quality score, not a credit score.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => updateStatus("qualified")}>Mark qualified</Button>
              <Button size="sm" variant="outline" onClick={runAutoMatch}>Run auto-match</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus("rejected")}>Reject</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus("duplicate")}>Duplicate</Button>
            </div>

            <div className="border-t border-[#262626] pt-4 space-y-3">
              <h4 className="font-medium text-white">Assign partner manually</h4>
              <div>
                <Label>Partner</Label>
                <select
                  className="mt-1 flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                >
                  <option value="">Select partner</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.business_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Lead price (ZAR)</Label>
                <input
                  className="mt-1 flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <Button onClick={assignPartner} disabled={!partnerId}>Assign and deliver</Button>
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-[#262626] bg-[#111] p-5">
          <h3 className="font-semibold text-white mb-3">Assignments</h3>
          {assignments.length === 0 ? (
            <p className="text-sm text-[#8c8c8c]">Not assigned yet</p>
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="text-sm text-[#bdbdbd] py-2 border-t border-[#262626] first:border-0">
                {(a as ConnectLeadAssignment & { connect_partners?: { business_name: string } }).connect_partners?.business_name}
                {" · "}R{a.price ?? 0} · {a.status} · {formatDate(a.assigned_at)}
              </div>
            ))
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
