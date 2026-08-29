import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("connect_partner_rules")
    .select(`
      id, partner_id, category_id, name, priority, min_income, max_income,
      lead_price, daily_limit, conditions, active, created_at,
      connect_partners ( business_name ),
      connect_lead_categories ( name, slug )
    `)
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const {
    partner_id,
    category_id,
    name,
    priority = 100,
    lead_price = 100,
    daily_limit,
    min_score = 70,
    province,
    min_income,
    max_income,
  } = body;

  if (!partner_id || !name) {
    return NextResponse.json({ error: "partner_id and name required" }, { status: 400 });
  }

  const conditions: Record<string, unknown> = { min_score: Number(min_score) };
  if (province) conditions.province = province;

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("connect_partner_rules")
    .insert({
      partner_id,
      category_id: category_id || null,
      name,
      priority: Number(priority),
      lead_price: Number(lead_price),
      daily_limit: daily_limit ? Number(daily_limit) : null,
      min_income: min_income ? Number(min_income) : null,
      max_income: max_income ? Number(max_income) : null,
      conditions,
      active: true,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ruleId: data.id });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { ruleId, active } = await req.json();
  if (!ruleId) return NextResponse.json({ error: "ruleId required" }, { status: 400 });

  const admin = createServiceClient();
  const { error } = await admin.from("connect_partner_rules").update({ active: !!active }).eq("id", ruleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
