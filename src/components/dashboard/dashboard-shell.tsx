"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Megaphone,
  Wallet,
  BarChart3,
  LogOut,
} from "lucide-react";
import { NotificationBell } from "@/components/dashboard/notification-bell";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/partners", label: "Partners", icon: Users },
  { href: "/dashboard/matching", label: "Matching", icon: GitBranch },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/revenue", label: "Revenue", icon: Wallet },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#262626] bg-[#111]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#8c8c8c]">RedFace Connect</p>
            <h1 className="text-lg font-semibold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link href="/" className="text-sm text-[#8c8c8c] hover:text-white">
              Public site
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="inline-flex items-center gap-2 text-sm text-[#8c8c8c] hover:text-white">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <aside className="lg:w-56 shrink-0">
          <nav className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex min-h-[44px] items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap",
                    active ? "bg-[#dc2626] text-white" : "text-[#bdbdbd] hover:bg-[#1a1a1a] hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
