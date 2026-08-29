import type { SupabaseClient } from "@supabase/supabase-js";

export async function notifyPartnerLeadDelivered(
  admin: SupabaseClient,
  partnerId: string,
  leadReference: string,
  leadId: string
) {
  await admin.from("connect_notifications").insert({
    partner_id: partnerId,
    type: "lead.delivered",
    title: "New lead assigned",
    message: `Lead ${leadReference} has been delivered to your queue.`,
    entity_type: "connect_leads",
    entity_id: leadId,
  });

  const { data: profiles } = await admin
    .from("connect_profiles")
    .select("id")
    .eq("partner_id", partnerId);

  if (profiles?.length) {
    await admin.from("connect_notifications").insert(
      profiles.map((p) => ({
        recipient_user_id: p.id,
        partner_id: partnerId,
        type: "lead.delivered",
        title: "New lead assigned",
        message: `Lead ${leadReference} is ready for contact.`,
        entity_type: "connect_leads",
        entity_id: leadId,
      }))
    );
  }
}

export async function notifyAdminNewLead(
  admin: SupabaseClient,
  leadReference: string,
  leadId: string
) {
  const { data: admins } = await admin
    .from("connect_profiles")
    .select("id")
    .in("role", ["admin", "connect_staff"]);

  if (!admins?.length) return;

  await admin.from("connect_notifications").insert(
    admins.map((a) => ({
      recipient_user_id: a.id,
      type: "lead.created",
      title: "New enquiry",
      message: `${leadReference} submitted via RedFace Connect.`,
      entity_type: "connect_leads",
      entity_id: leadId,
    }))
  );
}
