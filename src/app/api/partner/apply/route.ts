import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json();
  const { business_name, email, phone, partner_type, registration_number, website } = body;

  if (!business_name || !email) {
    return NextResponse.json({ error: "business_name and email required" }, { status: 400 });
  }

  const admin = createServiceClient();

  const { data: existing } = await admin
    .from("connect_profiles")
    .select("partner_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.partner_id) {
    return NextResponse.json({ error: "Account already linked to a partner" }, { status: 400 });
  }

  const { data: partner, error } = await admin
    .from("connect_partners")
    .insert({
      business_name,
      email,
      phone: phone ?? null,
      website: website ?? null,
      partner_type: partner_type ?? "financial_services",
      registration_number: registration_number ?? null,
      status: "pending",
      verification_status: "pending_review",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("connect_billing_accounts").insert({ partner_id: partner.id });

  await admin
    .from("connect_profiles")
    .update({ partner_id: partner.id, role: "client_owner" })
    .eq("id", user.id);

  await admin.from("connect_audit_logs").insert({
    action: "partner.applied",
    entity_type: "connect_partners",
    entity_id: partner.id,
    new_data: { business_name, email, user_id: user.id },
  });

  const { data: admins } = await admin
    .from("connect_profiles")
    .select("id")
    .in("role", ["admin", "connect_staff"]);

  if (admins?.length) {
    await admin.from("connect_notifications").insert(
      admins.map((a) => ({
        recipient_user_id: a.id,
        type: "partner.applied",
        title: "New partner application",
        message: `${business_name} applied to join RedFace Connect.`,
        entity_type: "connect_partners",
        entity_id: partner.id,
      }))
    );
  }

  return NextResponse.json({ ok: true, partnerId: partner.id, status: "pending" });
}
