-- Partner webhook delete policy

create policy connect_webhooks_partner_delete on public.connect_webhook_subscriptions
  for delete using (partner_id = public.connect_user_partner_id());
