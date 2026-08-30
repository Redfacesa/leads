import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json();
  const { business_name, contact_name, email, phone, website, channels } = body;
  if (!business_name || !email) {
    return NextResponse.json({ error: "business_name and email required" }, { status: 400 });
  }

  const admin = createServiceClient();

  const { data: existing } = await admin
    .from("connect_profiles")
    .select("lead_partner_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.lead_partner_id) {
    return NextResponse.json({ error: "Already registered as a lead partner" }, { status: 400 });
  }

  const { data: org, error } = await admin
    .from("connect_lead_partners")
    .insert({
      business_name,
      contact_name: contact_name ?? null,
      email,
      phone: phone ?? null,
      website: website ?? null,
      channels: channels ?? [],
      status: "pending",
      verification_status: "pending_review",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin
    .from("connect_profiles")
    .update({ lead_partner_id: org.id, role: "lead_partner" })
    .eq("id", user.id);

  const { data: admins } = await admin
    .from("connect_profiles")
    .select("id")
    .in("role", ["admin", "connect_staff"]);

  if (admins?.length) {
    await admin.from("connect_notifications").insert(
      admins.map((a) => ({
        recipient_user_id: a.id,
        type: "lead_partner.applied",
        title: "New lead partner application",
        message: `${business_name} applied to join the Red Leads partner network.`,
        entity_type: "connect_lead_partners",
        entity_id: org.id,
      }))
    );
  }

  return NextResponse.json({ ok: true, leadPartnerId: org.id, status: "pending" });
}
