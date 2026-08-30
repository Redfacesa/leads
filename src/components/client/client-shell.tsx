"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SetupGate } from "@/components/setup/setup-notice";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/client", label: "Dashboard" },
  { href: "/client/leads", label: "My Leads" },
  { href: "/client/marketplace", label: "Marketplace" },
  { href: "/client/billing", label: "Billing" },
  { href: "/client/webhooks", label: "Webhooks" },
];

export function ClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SetupGate>
      <div className="min-h-screen bg-[#0a0a0a]">
        <header className="border-b border-[#262626] bg-[#111]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <Link href="/" className="text-xs uppercase tracking-wider text-[#8c8c8c] hover:text-white">
                {BRAND.name}
              </Link>
              <p className="text-lg font-semibold text-white">Client Dashboard</p>
            </div>
            <nav className="flex items-center gap-2 sm:gap-4 text-sm">
              {nav.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "hidden sm:inline rounded-md px-2 py-1",
                    pathname === href || (href !== "/client" && pathname.startsWith(href))
                      ? "bg-[#dc2626] text-white"
                      : "text-[#bdbdbd] hover:text-white"
                  )}
                >
                  {label}
                </Link>
              ))}
              <NotificationBell />
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-[#bdbdbd] hover:text-white">Sign out</button>
              </form>
            </nav>
          </div>
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 sm:hidden">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-2 text-sm",
                  pathname === href ? "bg-[#dc2626] text-white" : "text-[#bdbdbd] bg-[#1a1a1a]"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </SetupGate>
  );
}
