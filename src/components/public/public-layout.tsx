import type { ReactNode } from "react";
import Link from "next/link";

import { RedLeadsLogo } from "@/components/brand/red-leads-logo";
import { BRAND } from "@/lib/branding";

export function PublicLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#262626] bg-[#111]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <RedLeadsLogo size="sm" />
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/apply" className="text-[#bdbdbd] hover:text-white">Apply</Link>
            <Link href="/login" className="text-[#bdbdbd] hover:text-white">Sign in</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {title && <h1 className="text-3xl font-bold text-white mb-6">{title}</h1>}
        {children}
      </main>
      <footer className="border-t border-[#262626] py-8">
        <div className="mx-auto max-w-3xl px-4 text-sm text-[#8c8c8c] sm:px-6 flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <a href="mailto:connect@redfacepay.co.za" className="hover:text-white">Contact</a>
        </div>
      </footer>
    </div>
  );
}
