import { PublicLayout } from "@/components/public/public-layout";

export default function TermsPage() {
  return (
    <PublicLayout title="Terms of Use">
      <div className="prose prose-invert max-w-none space-y-6 text-[#bdbdbd] text-sm leading-relaxed">
        <p className="text-base text-white">Last updated: August 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">1. About RedFace Connect</h2>
          <p>
            RedFace Connect (operated by RedFace Pay (Pty) Ltd) is an enquiry matching platform for South Africa.
            We help consumers submit financial help enquiries and connect them with participating, authorised service providers.
          </p>
          <p>
            RedFace Connect does not provide credit, loans, debt review, or financial advice. We do not approve or decline applications.
            Any financial decision remains with the authorised provider you choose to engage with.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">2. Consumer enquiries</h2>
          <p>
            By submitting an enquiry, you confirm the information you provide is accurate to the best of your knowledge.
            You consent to RedFace Connect and selected relevant service providers contacting you about your enquiry.
          </p>
          <p>
            Submitting an enquiry does not guarantee approval, contact, or an offer from any provider.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">3. Partner organisations</h2>
          <p>
            Partners listed on RedFace Connect are independent businesses. RedFace Connect verifies registration details where applicable
            but does not guarantee the outcome of any engagement between a consumer and a partner.
          </p>
          <p>
            Partners agree to contact consumers lawfully, honour opt-out requests, and comply with the National Credit Act,
            National Debt Act, and POPIA where applicable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">4. Acceptable use</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Do not submit false, misleading, or duplicate enquiries</li>
            <li>Do not scrape, resell, or redistribute lead data without authorisation</li>
            <li>Do not use the platform for spam, harassment, or unlawful marketing</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">5. Limitation of liability</h2>
          <p>
            RedFace Connect is provided as infrastructure for enquiry matching. To the extent permitted by law,
            we are not liable for decisions made by consumers or partners, or for losses arising from third-party services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">6. Contact</h2>
          <p>
            Questions about these terms:{" "}
            <a href="mailto:connect@redfacepay.co.za" className="text-[#dc2626] hover:underline">connect@redfacepay.co.za</a>
          </p>
        </section>
      </div>
    </PublicLayout>
  );
}
