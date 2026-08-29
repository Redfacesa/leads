import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requirePartnerSession } from "@/lib/auth/partner";
import { requireAdminSession } from "@/lib/auth/admin";

export async function GET() {
  const partnerAuth = await requirePartnerSession();
  if (partnerAuth.ok) {
    const { data, error } = await partnerAuth.supabase
      .from("connect_webhook_subscriptions")
      .select("id, url, events, active, created_at")
      .eq("partner_id", partnerAuth.partnerId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ webhooks: data ?? [] });
  }

  const adminAuth = await requireAdminSession();
  if (!adminAuth.ok) return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });

  const { data, error } = await adminAuth.supabase
    .from("connect_webhook_subscriptions")
    .select("*, connect_partners(business_name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ webhooks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requirePartnerSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { url, events } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const secret = randomBytes(32).toString("hex");
  const { data, error } = await auth.supabase
    .from("connect_webhook_subscriptions")
    .insert({
      partner_id: auth.partnerId,
      url,
      secret,
      events: events ?? ["lead.delivered"],
      active: true,
    })
    .select("id, url, secret, events, active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, webhook: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePartnerSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { webhookId, active, url, events } = await req.json();
  if (!webhookId) return NextResponse.json({ error: "webhookId required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof active === "boolean") updates.active = active;
  if (url) updates.url = url;
  if (events) updates.events = events;

  const { error } = await auth.supabase
    .from("connect_webhook_subscriptions")
    .update(updates)
    .eq("id", webhookId)
    .eq("partner_id", auth.partnerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePartnerSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const webhookId = searchParams.get("id");
  if (!webhookId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await auth.supabase
    .from("connect_webhook_subscriptions")
    .delete()
    .eq("id", webhookId)
    .eq("partner_id", auth.partnerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
