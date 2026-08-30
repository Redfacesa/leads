import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId, price, exclusive } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const { data, error } = await auth.supabase.rpc("connect_list_lead_on_marketplace", {
    p_lead_id: leadId,
    p_price: Number(price ?? 150),
    p_exclusive: exclusive ?? false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const result = data as { ok?: boolean; error?: string; listing_id?: string };
  if (!result?.ok) return NextResponse.json({ error: result.error ?? "list_failed" }, { status: 400 });

  return NextResponse.json({ ok: true, listingId: result.listing_id });
}
