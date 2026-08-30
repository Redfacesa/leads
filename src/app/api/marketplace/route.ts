import { NextResponse } from "next/server";
import { requirePartnerSession } from "@/lib/auth/partner";
import { createServiceClient } from "@/lib/supabase/server";
import { deliverLeadToPartner } from "@/lib/matching/engine";
import { relationOne } from "@/lib/supabase/relations";

export async function GET() {
  const auth = await requirePartnerSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.supabase
    .from("connect_marketplace_listings")
    .select("id, price, exclusive, preview_province, preview_income_band, preview_debt_band, preview_score, verified, listed_at, connect_lead_categories(name)")
    .eq("status", "available")
    .order("listed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requirePartnerSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { listingId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const admin = createServiceClient();

  const { data: listing } = await admin
    .from("connect_marketplace_listings")
    .select("*, connect_leads(id, lead_reference, status), connect_partners(business_name)")
    .eq("id", listingId)
    .eq("status", "available")
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: "Listing not available" }, { status: 404 });

  const lead = relationOne((listing as { connect_leads?: { id: string; lead_reference: string } | { id: string; lead_reference: string }[] }).connect_leads);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const { data: partner } = await admin.from("connect_partners").select("business_name").eq("id", auth.partnerId).maybeSingle();

  const delivered = await deliverLeadToPartner(admin, lead.id, {
    partnerId: auth.partnerId,
    partnerName: partner?.business_name ?? "Client",
    ruleId: null,
    price: Number(listing.price),
  }, { leadReference: lead.lead_reference });

  if (!delivered.ok) {
    return NextResponse.json({ error: delivered.error === "insufficient_balance" ? "Insufficient lead balance. Top up in Billing." : delivered.error }, { status: 402 });
  }

  await admin.from("connect_marketplace_listings").update({
    status: "sold",
    sold_at: new Date().toISOString(),
    buyer_partner_id: auth.partnerId,
  }).eq("id", listingId);

  await admin.from("connect_leads").update({ status: "sold" }).eq("id", lead.id);

  await admin.from("connect_lead_orders").insert({
    partner_id: auth.partnerId,
    lead_id: lead.id,
    listing_id: listingId,
    price: listing.price,
    exclusive: listing.exclusive,
    payment_status: "completed",
  });

  return NextResponse.json({ ok: true, leadId: lead.id, assignmentId: delivered.assignmentId });
}
