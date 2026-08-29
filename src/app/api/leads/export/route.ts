import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const province = searchParams.get("province");
  const q = searchParams.get("q");

  const admin = createServiceClient();
  let query = admin
    .from("connect_leads")
    .select("lead_reference, first_name, last_name, phone, email, province, city, employment_status, income_band, debt_band, lead_score, status, created_at, connect_lead_categories(name)")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (status) query = query.eq("status", status);
  if (province) query = query.eq("province", province);
  if (q) {
    query = query.or(`lead_reference.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = [
    "Reference", "First name", "Last name", "Phone", "Email", "Province", "City",
    "Employment", "Income band", "Debt band", "Score", "Status", "Category", "Created",
  ];

  const rows = (data ?? []).map((lead) => {
    const cat = (lead as { connect_lead_categories?: { name: string } | { name: string }[] }).connect_lead_categories;
    const categoryName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
    return [
      lead.lead_reference,
      lead.first_name,
      lead.last_name,
      lead.phone,
      lead.email,
      lead.province,
      lead.city,
      lead.employment_status,
      lead.income_band,
      lead.debt_band,
      lead.lead_score,
      lead.status,
      categoryName,
      lead.created_at,
    ].map(csvEscape).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `connect-leads-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
