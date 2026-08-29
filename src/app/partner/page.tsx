"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerPortalPage() {
  const [stats, setStats] = useState({ total: 0, new: 0, converted: 0 });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("connect_leads").select("status");
      const rows = (data ?? []) as { status: string }[];
      setStats({
        total: rows.length,
        new: rows.filter((row) => row.status === "delivered" || row.status === "new").length,
        converted: rows.filter((row) => row.status === "converted").length,
      });
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Partner overview</h2>
        <p className="text-[#8c8c8c]">Leads assigned to your organisation</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Assigned leads</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Needs contact</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.new}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#8c8c8c]">Converted</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.converted}</p></CardContent>
        </Card>
      </div>

      <Button asChild>
        <Link href="/partner/leads">View my leads</Link>
      </Button>
    </div>
  );
}
