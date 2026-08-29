import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { partnerId, amount, reference } = await req.json();
  if (!partnerId || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "partnerId and positive amount required" }, { status: 400 });
  }

  const { data, error } = await auth.supabase.rpc("connect_deposit_wallet", {
    p_partner_id: partnerId,
    p_amount: Number(amount),
    p_reference: reference ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const result = data as { ok?: boolean; balance?: number; error?: string };
  if (!result?.ok) return NextResponse.json({ error: result.error ?? "deposit_failed" }, { status: 400 });

  const admin = createServiceClient();
  await admin.from("connect_audit_logs").insert({
    action: "wallet.deposit",
    entity_type: "connect_billing_accounts",
    entity_id: partnerId,
    new_data: { amount: Number(amount), reference, balance: result.balance },
  });

  return NextResponse.json({ ok: true, balance: result.balance });
}
