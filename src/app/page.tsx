import Link from "next/link";
import { PublicHero } from "@/components/public/public-hero";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#262626] bg-[#111]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold text-white">
            RedFace <span className="text-[#dc2626]">Connect</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/apply" className="text-[#bdbdbd] hover:text-white">Apply</Link>
            <Link href="/login" className="text-[#bdbdbd] hover:text-white">Partner login</Link>
          </nav>
        </div>
      </header>
      <PublicHero />
      <footer className="border-t border-[#262626] py-10">
        <div className="mx-auto max-w-5xl px-4 text-sm text-[#8c8c8c] sm:px-6">
          <p>RedFace Connect matches enquiries with participating service providers. We do not approve credit or debt review.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <a href="mailto:connect@redfacepay.co.za" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
