"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { relationOne } from "@/lib/supabase/relations";

type Submission = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  province: string;
  city: string | null;
  employment_status: string | null;
  income_band: string | null;
  debt_band: string | null;
  enquiry_reason: string | null;
  status: string;
  created_at: string;
  connect_lead_categories?: { name: string } | { name: string }[];
  connect_lead_partners?: { business_name: string } | { business_name: string }[];
};

export default function SubmissionsAdminPage() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [filter, setFilter] = useState("pending_review");
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/lead-partners/submissions");
    const data = await res.json();
    setRows(data.submissions ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function review(submissionId: string, action: "accept" | "reject") {
    setBusy(submissionId);
    await fetch("/api/lead-partners/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        action,
        rejectionReason: rejectReason[submissionId],
      }),
    });
    setBusy(null);
    load();
  }

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Partner submissions</h2>
            <p className="text-[#8c8c8c]">Quality gate before partner leads enter inventory</p>
          </div>
          <select
            className="rounded-md border border-[#262626] bg-[#111] px-3 py-2 text-sm text-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="pending_review">Pending review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="duplicate">Duplicate</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-center text-[#8c8c8c] py-12">No submissions in this queue</p>
          ) : (
            filtered.map((row) => {
              const category = relationOne(row.connect_lead_categories);
              const partner = relationOne(row.connect_lead_partners);
              return (
                <div key={row.id} className="rounded-lg border border-[#262626] bg-[#111] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {row.first_name} {row.last_name}
                      </p>
                      <p className="text-sm text-[#bdbdbd]">
                        {partner?.business_name ?? "Partner"} · {category?.name ?? "Category"} · {row.province}
                      </p>
                      <p className="mt-1 text-sm text-[#8c8c8c]">
                        {row.phone}
                        {row.email ? ` · ${row.email}` : ""}
                      </p>
                      {(row.employment_status || row.income_band || row.debt_band) && (
                        <p className="mt-2 text-xs text-[#666]">
                          {[row.employment_status, row.income_band, row.debt_band].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {row.enquiry_reason && (
                        <p className="mt-2 text-sm text-[#bdbdbd]">{row.enquiry_reason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <StatusBadge status={row.status} />
                      <p className="mt-2 text-xs text-[#666]">{formatDate(row.created_at)}</p>
                    </div>
                  </div>

                  {row.status === "pending_review" && (
                    <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-[#262626] pt-4">
                      <div className="min-w-[200px] flex-1">
                        <Input
                          placeholder="Rejection reason (optional)"
                          value={rejectReason[row.id] ?? ""}
                          onChange={(e) => setRejectReason({ ...rejectReason, [row.id]: e.target.value })}
                        />
                      </div>
                      <Button
                        onClick={() => review(row.id, "accept")}
                        disabled={busy === row.id}
                      >
                        Accept into inventory
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => review(row.id, "reject")}
                        disabled={busy === row.id}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
