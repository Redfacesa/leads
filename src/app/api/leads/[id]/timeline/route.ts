import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const admin = createServiceClient();

  const [{ data: history }, { data: auditLead }, { data: assignments }, { data: consent }] = await Promise.all([
    admin
      .from("connect_lead_status_history")
      .select("old_status, new_status, reason, created_at")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("connect_audit_logs")
      .select("action, new_data, created_at")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("connect_lead_assignments").select("id").eq("lead_id", id),
    admin
      .from("connect_lead_consent")
      .select("consent_given, policy_version, source, created_at")
      .eq("lead_id", id)
      .maybeSingle(),
  ]);

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  let auditAssignment: typeof auditLead = [];
  if (assignmentIds.length) {
    const { data } = await admin
      .from("connect_audit_logs")
      .select("action, new_data, created_at")
      .in("entity_id", assignmentIds)
      .order("created_at", { ascending: false })
      .limit(10);
    auditAssignment = data ?? [];
  }

  const audit = [...(auditLead ?? []), ...auditAssignment].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({
    statusHistory: history ?? [],
    auditLog: audit ?? [],
    consent: consent ?? null,
  });
}
