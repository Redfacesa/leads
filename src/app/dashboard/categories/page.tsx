"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  description: string | null;
  active: boolean;
  requires_regulated_partner: boolean;
  sort_order: number;
}

const VERTICAL_LABELS: Record<string, string> = {
  financial: "Financial",
  business: "Business",
  home: "Home",
  automotive: "Automotive",
  insurance: "Insurance",
  other: "Other",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("connect_lead_categories")
        .select("*")
        .order("sort_order");
      setCategories((data ?? []) as CategoryRow[]);
    }
    load();
  }, []);

  const byVertical = categories.reduce<Record<string, CategoryRow[]>>((acc, cat) => {
    const v = cat.vertical ?? "other";
    if (!acc[v]) acc[v] = [];
    acc[v].push(cat);
    return acc;
  }, {});

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Lead categories</h2>
          <p className="text-[#8c8c8c]">{categories.length} categories across {Object.keys(byVertical).length} verticals</p>
        </div>

        {Object.entries(byVertical).map(([vertical, cats]) => (
          <Card key={vertical}>
            <CardHeader>
              <CardTitle>{VERTICAL_LABELS[vertical] ?? vertical}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-[#8c8c8c]">
                    <tr>
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Slug</th>
                      <th className="pb-2 pr-4">Regulated</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cats.map((cat) => (
                      <tr key={cat.id} className="border-t border-[#262626]">
                        <td className="py-2 text-white">{cat.name}</td>
                        <td className="py-2 font-mono text-[#bdbdbd]">{cat.slug}</td>
                        <td className="py-2 text-[#bdbdbd]">{cat.requires_regulated_partner ? "Yes" : "No"}</td>
                        <td className="py-2"><StatusBadge status={cat.active ? "active" : "archived"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
