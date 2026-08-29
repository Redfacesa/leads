"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.notifications ?? []);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const unread = items.filter((n) => !n.read_at).length;

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    load();
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    load();
  }

  function entityLink(n: Notification): string | null {
    if (n.entity_type === "connect_leads" && n.entity_id) {
      return `/dashboard/leads/${n.entity_id}`;
    }
    if (n.entity_type === "connect_partners" && n.entity_id) {
      return `/dashboard/partners`;
    }
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[#bdbdbd] hover:bg-[#1a1a1a] hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-label="Close notifications" />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-[#262626] bg-[#111] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#262626] px-4 py-3">
              <p className="text-sm font-semibold text-white">Notifications</p>
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-xs text-[#dc2626] hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-[#8c8c8c]">No notifications yet</p>
              ) : (
                items.map((n) => {
                  const href = entityLink(n);
                  const inner = (
                    <div
                      className={cn(
                        "border-b border-[#262626] px-4 py-3 last:border-0",
                        !n.read_at && "bg-[#1a1a1a]"
                      )}
                    >
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="mt-1 text-xs text-[#bdbdbd]">{n.message}</p>
                      <p className="mt-1 text-xs text-[#8c8c8c]">{formatDate(n.created_at)}</p>
                    </div>
                  );

                  if (href) {
                    return (
                      <Link
                        key={n.id}
                        href={href}
                        onClick={() => { markRead(n.id); setOpen(false); }}
                        className="block hover:bg-[#1a1a1a]"
                      >
                        {inner}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="block w-full text-left hover:bg-[#1a1a1a]"
                    >
                      {inner}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
