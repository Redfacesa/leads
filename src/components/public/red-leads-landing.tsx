import Link from "next/link";
import {
  ArrowDown,
  CreditCard,
  Briefcase,
  Home,
  Car,
  Shield,
  Plus,
  Megaphone,
  Globe,
  Wallet,
  Sun,
  Lock,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND, DISCLAIMERS } from "@/lib/branding";

const STEPS = [
  { n: "1", title: "We Attract", body: "Meta Ads, TikTok, Google, landing pages, SEO, content, partnerships, and referral campaigns." },
  { n: "2", title: "We Capture", body: "The potential customer completes a consent-based form on a category-specific funnel." },
  { n: "3", title: "We Qualify", body: "Category-specific questions capture intent, affordability bands, and service fit." },
  { n: "4", title: "We Verify", body: "Duplicate detection, fraud checks, lead quality scoring, and OTP verification (Phase 3)." },
  { n: "5", title: "We Deliver", body: "Qualified leads reach the right client dashboard or marketplace inventory." },
];

const CATEGORY_CARDS = [
  { icon: CreditCard, title: "Financial Services", desc: "Debt review, consolidation, credit repair, and personal finance enquiries.", vertical: "financial" },
  { icon: Briefcase, title: "Business Services", desc: "Websites, marketing, POS, payments, loans, and accounting leads.", vertical: "business" },
  { icon: Home, title: "Home Services", desc: "Solar, security, fibre, and home loan quote requests.", vertical: "home" },
  { icon: Car, title: "Automotive", desc: "Vehicle finance and automotive service enquiries.", vertical: "automotive" },
  { icon: Shield, title: "Insurance", desc: "Personal and business insurance quote requests.", vertical: "insurance" },
  { icon: Plus, title: "More Categories", desc: "Custom campaigns built for your vertical.", vertical: "other" },
];

export function RedLeadsLanding() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#dc2626]">{BRAND.name}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {BRAND.tagline}
          </h1>
          <p className="mt-6 text-lg text-[#bdbdbd]">{BRAND.subtitle}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Get Leads</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/services">Generate Leads For My Business</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-[#262626] bg-[#111] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">How it works</h2>
          <p className="mt-2 text-[#8c8c8c]">From traffic to converted customer, tracked end to end.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dc2626] text-sm font-bold text-white">
                  {step.n}
                </div>
                <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-[#bdbdbd]">{step.body}</p>
                {i < STEPS.length - 1 && (
                  <ArrowDown className="absolute -bottom-4 left-4 hidden h-5 w-5 text-[#404040] lg:block lg:-right-3 lg:top-4 lg:rotate-[-90deg]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Lead categories</h2>
        <p className="mt-2 text-[#8c8c8c]">Unlimited verticals. One lead operating system.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_CARDS.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="hover:border-[#404040] transition-colors">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-[#dc2626]/10">
                  <Icon className="h-5 w-5 text-[#dc2626]" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/apply">Submit an enquiry (consumer)</Link>
          </Button>
        </div>
      </section>

      {/* For businesses */}
      <section className="border-y border-[#262626] bg-[#111] py-16">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Stop Searching for Customers. Meet Them Here.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#bdbdbd]">
            Get access to leads generated through targeted campaigns and qualification funnels.
            View, contact, and convert from your own client dashboard.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/signup">Create Business Account</Link>
          </Button>
        </div>
      </section>

      {/* For partners - Phase 4 teaser */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-lg border border-[#262626] bg-[#111] p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-sm uppercase tracking-wider text-[#8c8c8c]">Phase 2+</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Become a Lead Partner</h2>
              <p className="mt-3 text-[#bdbdbd]">
                Approved agencies and marketers will run campaigns, submit leads, and earn revenue
                under Red Leads quality and compliance checks. Coming after marketplace launch.
              </p>
            </div>
            <Button asChild variant="outline" disabled>
              <span>Partner network (soon)</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="border-t border-[#262626] py-12">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm text-[#8c8c8c]">
            Part of the {BRAND.ecosystem} ecosystem · Payments via RedFace Pay · Campaigns via RedFace Studio
          </p>
          <p className="mt-4 text-xs text-[#666]">{DISCLAIMERS.consumer}</p>
        </div>
      </section>
    </>
  );
}

/** Compact category icons for apply form grouping */
export const VERTICAL_ICONS = {
  financial: CreditCard,
  business: Briefcase,
  home: Home,
  automotive: Car,
  insurance: Shield,
  other: Plus,
  megaphone: Megaphone,
  globe: Globe,
  wallet: Wallet,
  sun: Sun,
  lock: Lock,
  wifi: Wifi,
} as const;
