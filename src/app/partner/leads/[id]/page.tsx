"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import type { ConnectLead } from "@/lib/types";

const PARTNER_STATUSES = ["contacted", "in_progress", "converted", "not_interested", "uncontactable"] as const;

export default function PartnerLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<ConnectLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    const supabase = createClient();
    await supabase.from("connect_leads").update({ status }).eq("id", lead.id);
    setLead({ ...lead, status: status as ConnectLead["status"] });
    setSaving(false);
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
          </p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <section className="rounded-lg border border-[#262626] bg-[#111] p-5 space-y-2 text-sm text-[#bdbdbd]">
        <p><span className="text-[#8c8c8c]">Name:</span> {lead.first_name} {lead.last_name}</p>
        <p><span className="text-[#8c8c8c]">Phone:</span> {lead.phone}</p>
        {lead.email && <p><span className="text-[#8c8c8c]">Email:</span> {lead.email}</p>}
        <p><span className="text-[#8c8c8c]">Province:</span> {lead.province}</p>
        {lead.income_band && <p><span className="text-[#8c8c8c]">Income:</span> {lead.income_band}</p>}
        {lead.enquiry_reason && <p><span className="text-[#8c8c8c]">Enquiry:</span> {lead.enquiry_reason}</p>}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-white">Update outcome</h3>
        <div className="flex flex-wrap gap-2">
          {PARTNER_STATUSES.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={lead.status === status ? "default" : "outline"}
              disabled={saving}
              onClick={() => updateStatus(status)}
            >
              {status.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </section>

      <Button asChild variant="outline">
        <Link href="/partner/leads">Back to leads</Link>
      </Button>
    </div>
  );
}
