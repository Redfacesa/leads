import { PublicLayout } from "@/components/public/public-layout";

export default function PrivacyPage() {
  return (
    <PublicLayout title="Privacy Policy">
      <div className="space-y-6 text-[#bdbdbd] text-sm leading-relaxed">
        <p className="text-base text-white">Last updated: August 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">1. Who we are</h2>
          <p>
            RedFace Connect is operated by RedFace Pay (Pty) Ltd, responsible party under the Protection of Personal Information Act (POPIA).
            Contact: <a href="mailto:connect@redfacepay.co.za" className="text-[#dc2626] hover:underline">connect@redfacepay.co.za</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">2. What we collect</h2>
          <p>When you submit an enquiry, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Name, phone number, email, province, and city</li>
            <li>Employment, income band, debt band, and enquiry reason (optional)</li>
            <li>Consent record, IP address, and browser information</li>
            <li>Campaign attribution (UTM parameters) when present</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">3. Why we process your information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To receive and qualify your enquiry</li>
            <li>To connect you with relevant participating service providers</li>
            <li>To prevent duplicate or fraudulent submissions</li>
            <li>To improve platform quality and reporting (aggregated where possible)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">4. Sharing with partners</h2>
          <p>
            We share enquiry details with participating partners only when necessary to respond to your request,
            and only after you have given explicit consent on the enquiry form.
            Partners must use your information only for the stated purpose and comply with POPIA.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">5. Retention</h2>
          <p>
            Enquiry records are retained for as long as needed to operate the platform, resolve disputes,
            and meet legal obligations. You may request access, correction, or deletion subject to lawful exceptions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">6. Security</h2>
          <p>
            We use encryption in transit, access controls, and audit logging to protect personal information.
            No system is perfectly secure; report concerns to{" "}
            <a href="mailto:connect@redfacepay.co.za" className="text-[#dc2626] hover:underline">connect@redfacepay.co.za</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">7. Your rights</h2>
          <p>Under POPIA you may request access, correction, deletion, or object to processing. Email us with your reference number if available.</p>
        </section>
      </div>
    </PublicLayout>
  );
}
