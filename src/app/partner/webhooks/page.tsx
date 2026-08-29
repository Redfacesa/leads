"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface WebhookRow {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  created_at: string;
}

export default function PartnerWebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [url, setUrl] = useState("");
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/webhooks");
    if (res.ok) {
      const data = await res.json();
      setWebhooks(data.webhooks ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createWebhook(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, events: ["lead.delivered"] }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewSecret(data.webhook?.secret ?? null);
      setUrl("");
      load();
    }
  }

  async function toggleWebhook(id: string, active: boolean) {
    await fetch("/api/webhooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookId: id, active: !active }),
    });
    load();
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Remove this webhook endpoint?")) return;
    await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Webhooks</h2>
        <p className="text-[#8c8c8c]">Receive real-time notifications when leads are delivered</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Add endpoint</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createWebhook} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>HTTPS URL</Label>
              <Input type="url" placeholder="https://your-crm.com/webhooks/connect" value={url} onChange={(e) => setUrl(e.target.value)} required />
            </div>
            <Button type="submit">Add webhook</Button>
          </form>
          {newSecret && (
            <div className="mt-4 rounded-md border border-[#262626] bg-[#0a0a0a] p-4">
              <p className="text-sm text-white">Save your signing secret now. It will not be shown again.</p>
              <code className="mt-2 block break-all text-xs text-[#dc2626]">{newSecret}</code>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active endpoints</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[#8c8c8c]">Loading...</p>
          ) : webhooks.length === 0 ? (
            <p className="text-sm text-[#8c8c8c]">No webhooks configured</p>
          ) : (
            <div className="space-y-4">
              {webhooks.map((wh) => (
                <div key={wh.id} className="rounded-lg border border-[#262626] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-mono text-sm text-white break-all">{wh.url}</p>
                      <p className="mt-1 text-xs text-[#8c8c8c]">
                        Events: {wh.events.join(", ")} · Added {formatDate(wh.created_at)}
                      </p>
                      <p className="mt-1 text-xs text-[#8c8c8c]">
                        Status: {wh.active ? "Active" : "Paused"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleWebhook(wh.id, wh.active)}>
                        {wh.active ? "Pause" : "Enable"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteWebhook(wh.id)}>Remove</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-[#262626] bg-[#111] p-4 text-sm text-[#bdbdbd]">
        <p className="font-medium text-white">Verification</p>
        <p className="mt-2">Each request includes an <code className="text-[#dc2626]">X-Connect-Signature</code> header (HMAC SHA-256 of the body using your secret).</p>
      </div>

      <Button asChild variant="outline">
        <Link href="/partner">Back to overview</Link>
      </Button>
    </div>
  );
}
