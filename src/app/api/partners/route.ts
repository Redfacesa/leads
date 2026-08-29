import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();
  const { business_name, email, phone, partner_type, registration_number } = body;
  if (!business_name || !email) {
    return NextResponse.json({ error: "business_name and email required" }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("connect_partners")
    .insert({
      business_name,
      email,
      phone: phone ?? null,
      partner_type: partner_type ?? "financial_services",
      registration_number: registration_number ?? null,
      status: "pending",
      verification_status: "unverified",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("connect_billing_accounts").insert({ partner_id: data.id });

  return NextResponse.json({ ok: true, partnerId: data.id });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { partnerId, status, verification_status } = await req.json();
  if (!partnerId) return NextResponse.json({ error: "partnerId required" }, { status: 400 });

  const admin = createServiceClient();
  const updates: Record<string, string> = {};
  if (status) updates.status = status;
  if (verification_status) updates.verification_status = verification_status;

  const { error } = await admin.from("connect_partners").update(updates).eq("id", partnerId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
