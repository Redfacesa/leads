import Link from "next/link";
import { RedLeadsLanding } from "@/components/public/red-leads-landing";
import { RedLeadsLogo } from "@/components/brand/red-leads-logo";
import { BRAND } from "@/lib/branding";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-50 border-b border-[#262626] bg-[#111]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <RedLeadsLogo size="sm" priority />
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/apply" className="text-[#bdbdbd] hover:text-white">Enquire</Link>
            <Link href="/services" className="hidden sm:inline text-[#bdbdbd] hover:text-white">Services</Link>
            <Link href="/signup" className="text-[#bdbdbd] hover:text-white">Get Leads</Link>
            <Link href="/login?next=/dashboard" className="text-[#bdbdbd] hover:text-white">Admin</Link>
            <Link href="/login?next=/client" className="rounded-md bg-[#dc2626] px-3 py-2 text-white hover:bg-[#b91c1c]">
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <RedLeadsLanding />
      <footer className="border-t border-[#262626] py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#8c8c8c]">
              {BRAND.name} · {BRAND.domain} · Part of the {BRAND.ecosystem} ecosystem
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-[#8c8c8c]">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
