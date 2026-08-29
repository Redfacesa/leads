import type { ReactNode } from "react";
import Link from "next/link";
import { SetupGate } from "@/components/setup/setup-notice";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <SetupGate>
      <div className="min-h-screen bg-[#0a0a0a]">
        <header className="border-b border-[#262626] bg-[#111]">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8c8c8c]">RedFace Connect</p>
              <p className="text-lg font-semibold text-white">Partner Portal</p>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/partner" className="text-[#bdbdbd] hover:text-white">Overview</Link>
              <Link href="/partner/leads" className="text-[#bdbdbd] hover:text-white">Leads</Link>
              <Link href="/" className="text-[#bdbdbd] hover:text-white">Public site</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </SetupGate>
  );
}
