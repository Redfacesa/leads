"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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

export default function ClientWebhooksPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Webhooks</h2>
        <p className="text-[#8c8c8c]">Push lead events to your CRM in real time</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Add endpoint</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createWebhook} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>HTTPS URL</Label>
              <Input type="url" placeholder="https://your-crm.com/webhooks/redleads" value={url} onChange={(e) => setUrl(e.target.value)} required />
            </div>
            <Button type="submit">Add webhook</Button>
          </form>
          {newSecret && (
            <div className="mt-4 rounded-md border border-[#262626] bg-[#0a0a0a] p-4">
              <p className="text-sm text-white">Save your signing secret now.</p>
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
            webhooks.map((wh) => (
              <div key={wh.id} className="border-t border-[#262626] py-3 first:border-0">
                <p className="font-mono text-sm text-white break-all">{wh.url}</p>
                <p className="text-xs text-[#8c8c8c]">Added {formatDate(wh.created_at)} · {wh.active ? "Active" : "Paused"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
