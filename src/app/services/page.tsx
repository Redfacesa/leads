import Link from "next/link";
import { PublicLayout } from "@/components/public/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/branding";

const PACKAGES = [
  { name: "Starter", leads: "20 leads / month", price: "From R2,500", desc: "Ideal for small sales teams testing a vertical." },
  { name: "Growth", leads: "100 leads / month", price: "From R9,500", desc: "For established teams with daily calling capacity." },
  { name: "Enterprise", leads: "Custom volume", price: "Custom", desc: "Dedicated funnels, SLAs, and account management." },
];

export default function ServicesPage() {
  return (
    <PublicLayout title="Lead Generation as a Service">
      <div className="space-y-10 text-[#bdbdbd]">
        <p className="text-lg text-white">
          We build the full stack: landing pages, ads, qualification funnels, and your client dashboard.
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">What we deliver</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>Category-specific landing page and form</li>
            <li>Meta, TikTok, or Google campaign setup guidance</li>
            <li>Consent and POPIA-compliant capture flow</li>
            <li>Lead scoring, duplicate detection, and quality checks</li>
            <li>Delivery to your {BRAND.name} client dashboard</li>
          </ul>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <Card key={pkg.name}>
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium text-white">{pkg.leads}</p>
                <p className="text-[#dc2626] font-semibold">{pkg.price}</p>
                <p>{pkg.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-lg border border-[#262626] bg-[#111] p-6">
          <h2 className="text-lg font-semibold text-white">Pricing model</h2>
          <p className="mt-2 text-sm">
            Setup fee + monthly management + cost per qualified lead. Pay-per-lead and marketplace options also available for self-serve clients.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signup">Create client account</Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:${BRAND.supportEmail}?subject=Lead%20Gen%20Service`}>Contact sales</a>
            </Button>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
