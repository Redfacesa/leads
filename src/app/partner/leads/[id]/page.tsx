"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import type { ConnectLead } from "@/lib/types";

const PARTNER_STATUSES = [
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In progress" },
  { value: "converted", label: "Converted" },
  { value: "not_interested", label: "Not interested" },
  { value: "uncontactable", label: "Uncontactable" },
] as const;

export default function PartnerLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<ConnectLead | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("connect_leads")
        .select("*, connect_lead_categories(name)")
        .eq("id", params.id)
        .maybeSingle();
      setLead(data as ConnectLead | null);
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function updateStatus(status: string) {
    if (!lead) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/partner/leads/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, status, note: note || undefined }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    setLead({ ...lead, status: status as ConnectLead["status"] });
    setNote("");
  }

  if (loading) return <p className="text-[#8c8c8c]">Loading lead...</p>;
  if (!lead) return <p className="text-[#8c8c8c]">Lead not found or not assigned to you.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">{lead.lead_reference}</h2>
          <p className="text-[#8c8c8c]">
            {(lead as ConnectLead & { connect_lead_categories?: { name: string } }).connect_lead_categories?.name}
            {" · "}Received {formatDate(lead.created_at)}
          </p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <section className="rounded-lg border border-[#262626] bg-[#111] p-5 space-y-2 text-sm text-[#bdbdbd]">
        <p><span className="text-[#8c8c8c]">Name:</span> {lead.first_name} {lead.last_name}</p>
        <p>
          <span className="text-[#8c8c8c]">Phone:</span>{" "}
          <a href={`tel:${lead.phone}`} className="text-[#dc2626] hover:underline">{lead.phone}</a>
        </p>
        {lead.email && (
          <p>
            <span className="text-[#8c8c8c]">Email:</span>{" "}
            <a href={`mailto:${lead.email}`} className="text-[#dc2626] hover:underline">{lead.email}</a>
          </p>
        )}
        <p><span className="text-[#8c8c8c]">Province:</span> {lead.province}{lead.city ? `, ${lead.city}` : ""}</p>
        {lead.employment_status && <p><span className="text-[#8c8c8c]">Employment:</span> {lead.employment_status}</p>}
        {lead.income_band && <p><span className="text-[#8c8c8c]">Income:</span> {lead.income_band}</p>}
        {lead.debt_band && <p><span className="text-[#8c8c8c]">Debt:</span> {lead.debt_band}</p>}
        {lead.enquiry_reason && <p><span className="text-[#8c8c8c]">Enquiry:</span> {lead.enquiry_reason}</p>}
      </section>

      <section className="rounded-lg border border-[#262626] bg-[#111] p-5 space-y-4">
        <h3 className="font-semibold text-white">Update outcome</h3>
        <div>
          <Label>Note (optional)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Call outcome, next steps..." rows={2} />
        </div>
        <div className="flex flex-wrap gap-2">
          {PARTNER_STATUSES.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={lead.status === value ? "default" : "outline"}
              disabled={saving}
              onClick={() => updateStatus(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        {error && <p className="text-sm text-[#dc2626]">{error}</p>}
      </section>

      <Button asChild variant="outline">
        <Link href="/partner/leads">Back to leads</Link>
      </Button>
    </div>
  );
}
