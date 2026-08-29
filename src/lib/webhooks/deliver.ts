import type { SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

export async function enqueuePartnerWebhooks(
  admin: SupabaseClient,
  partnerId: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  const { data: subs } = await admin
    .from("connect_webhook_subscriptions")
    .select("id, url, secret, events")
    .eq("partner_id", partnerId)
    .eq("active", true);

  for (const sub of subs ?? []) {
    if (!sub.events?.includes(eventType)) continue;

    const { data: event } = await admin.from("connect_webhook_events").insert({
      subscription_id: sub.id,
      event_type: eventType,
      payload,
      status: "pending",
    }).select("id").single();

    if (event?.id) {
      void deliverWebhook(sub.url, sub.secret, eventType, payload, admin, event.id);
    }
  }
}

async function deliverWebhook(
  url: string,
  secret: string,
  eventType: string,
  payload: Record<string, unknown>,
  admin: SupabaseClient,
  eventId: string
) {
  const body = JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() });
  const signature = createHmac("sha256", secret).update(body).digest("hex");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Connect-Signature": signature,
        "X-Connect-Event": eventType,
      },
      body,
    });

    await admin
      .from("connect_webhook_events")
      .update({
        status: res.ok ? "delivered" : "failed",
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", eventId);
  } catch {
    await admin
      .from("connect_webhook_events")
      .update({ status: "failed", attempts: 1, last_attempt_at: new Date().toISOString() })
      .eq("id", eventId);
  }
}
