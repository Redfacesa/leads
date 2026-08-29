import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const options = [
  {
    slug: "personal_finance",
    title: "Personal Finance",
    description: "Explore personal finance and loan enquiry options.",
  },
  {
    slug: "debt_assistance",
    title: "Debt Assistance",
    description: "Get help with debt pressure, repayments, or debt review.",
  },
  {
    slug: "credit_help",
    title: "Credit-Related Help",
    description: "Understand and improve your credit profile where appropriate.",
  },
  {
    slug: "business_funding",
    title: "Business Funding",
    description: "Funding enquiries for SMEs and business owners.",
  },
];

export function PublicHero() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm uppercase tracking-wider text-[#8c8c8c]">RedFace Connect</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Need financial assistance?
        </h1>
        <p className="mt-4 text-lg text-[#bdbdbd]">
          Tell us what you need help with. We connect your enquiry with relevant participating service providers in South Africa.
        </p>
        <p className="mt-2 text-sm text-[#8c8c8c]">
          One enquiry. Relevant options. No guaranteed approval claims.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/apply">Start your enquiry</Link>
          </Button>
        </div>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {options.map((opt) => (
          <Card key={opt.slug} className="hover:border-[#404040] transition-colors">
            <CardHeader>
              <CardTitle>{opt.title}</CardTitle>
              <CardDescription>{opt.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={`/apply?category=${opt.slug}`}>Start</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
