"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { SA_PROVINCES } from "@/lib/utils";

interface RuleRow {
  id: string;
  name: string;
  priority: number;
  lead_price: number;
  daily_limit: number | null;
  active: boolean;
  conditions: { min_score?: number; province?: string } | null;
  connect_partners?: { business_name: string } | null;
  connect_lead_categories?: { name: string; slug: string } | null;
}

interface PartnerOption {
  id: string;
  business_name: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export default function MatchingPage() {
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    partner_id: "",
    category_id: "",
    name: "",
    priority: "100",
    lead_price: "100",
    daily_limit: "",
    min_score: "70",
    province: "",
  });

  async function loadRules() {
    const res = await fetch("/api/matching/rules");
    const data = await res.json();
    setRules(data.rules ?? []);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: partnerData }, { data: categoryData }] = await Promise.all([
        supabase.from("connect_partners").select("id, business_name").eq("status", "active").order("business_name"),
        supabase.from("connect_lead_categories").select("id, name, slug").eq("active", true).order("sort_order"),
      ]);
      setPartners((partnerData ?? []) as PartnerOption[]);
      setCategories((categoryData ?? []) as CategoryOption[]);
      loadRules();
    }
    load();
  }, []);

  async function createRule(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/matching/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        category_id: form.category_id || null,
        province: form.province || null,
        daily_limit: form.daily_limit || null,
      }),
    });
    setShowForm(false);
    setForm({ partner_id: "", category_id: "", name: "", priority: "100", lead_price: "100", daily_limit: "", min_score: "70", province: "" });
    loadRules();
  }

  async function toggleRule(ruleId: string, active: boolean) {
    await fetch("/api/matching/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId, active }),
    });
    loadRules();
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Matching rules</h2>
            <p className="text-[#8c8c8c]">Auto-route qualified leads to partners on submit</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add rule"}</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How matching works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[#bdbdbd] space-y-1">
            <p>1. New enquiry is scored and saved</p>
            <p>2. Active rules are checked by priority (lowest number first)</p>
            <p>3. First matching active, verified partner receives the lead</p>
            <p>4. If no rule matches, admin assigns manually</p>
          </CardContent>
        </Card>

        {showForm && (
          <form onSubmit={createRule} className="rounded-lg border border-[#262626] bg-[#111] p-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Rule name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Gauteng debt assistance" required />
            </div>
            <div>
              <Label>Partner</Label>
              <select className="mt-1 flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm" value={form.partner_id} onChange={(e) => setForm({ ...form, partner_id: e.target.value })} required>
                <option value="">Select partner</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.business_name}</option>)}
              </select>
            </div>
            <div>
              <Label>Category</Label>
              <select className="mt-1 flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Any category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Province filter</Label>
              <select className="mt-1 flex h-11 w-full rounded-md border border-[#262626] bg-[#1a1a1a] px-3 text-sm" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}>
                <option value="">Any province</option>
                {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label>Min lead score</Label>
              <Input type="number" min={0} max={100} value={form.min_score} onChange={(e) => setForm({ ...form, min_score: e.target.value })} />
            </div>
            <div>
              <Label>Priority (lower = first)</Label>
              <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
            </div>
            <div>
              <Label>Lead price (ZAR)</Label>
              <Input type="number" value={form.lead_price} onChange={(e) => setForm({ ...form, lead_price: e.target.value })} />
            </div>
            <div>
              <Label>Daily limit (optional)</Label>
              <Input type="number" value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Save rule</Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#111] text-left text-[#8c8c8c]">
              <tr>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Province</th>
                <th className="px-4 py-3">Min score</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#8c8c8c]">No rules yet. Add a rule to enable auto-matching.</td></tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="border-t border-[#262626]">
                    <td className="px-4 py-3 text-white">{rule.name}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{rule.connect_partners?.business_name}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{rule.connect_lead_categories?.name ?? "Any"}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{rule.conditions?.province ?? "Any"}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{rule.conditions?.min_score ?? 70}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">R{rule.lead_price}</td>
                    <td className="px-4 py-3 text-[#bdbdbd]">{rule.active ? "Active" : "Paused"}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => toggleRule(rule.id, !rule.active)}>
                        {rule.active ? "Pause" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
