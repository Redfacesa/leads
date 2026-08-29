"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import type { ConnectPartner } from "@/lib/types";

export default function PartnersPage() {
  const [partners, setPartners] = useState<ConnectPartner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    email: "",
    phone: "",
    partner_type: "financial_services",
    registration_number: "",
  });

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("connect_partners").select("*").order("created_at", { ascending: false });
    setPartners((data ?? []) as ConnectPartner[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function createPartner(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ business_name: "", email: "", phone: "", partner_type: "financial_services", registration_number: "" });
    load();
  }

  async function approvePartner(id: string) {
    await fetch("/api/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: id, status: "active", verification_status: "verified" }),
    });
    load();
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Partners</h2>
            <p className="text-[#8c8c8c]">Approved financial service businesses</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add partner"}</Button>
        </div>

        {showForm && (
          <form onSubmit={createPartner} className="rounded-lg border border-[#262626] bg-[#111] p-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Business name</Label>
              <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Registration number</Label>
              <Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Save partner</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#111] text-left text-[#8c8c8c]">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-t border-[#262626]">
                  <td className="px-4 py-3 text-white">{p.business_name}</td>
                  <td className="px-4 py-3 text-[#bdbdbd]">{p.partner_type}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.verification_status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    {p.status === "pending" && (
                      <Button size="sm" onClick={() => approvePartner(p.id)}>Approve</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
