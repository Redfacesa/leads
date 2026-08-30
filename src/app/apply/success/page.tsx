import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/public/public-layout";

export default async function ApplySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; matched?: string; partner?: string }>;
}) {
  const { ref, matched, partner } = await searchParams;
  const wasMatched = matched === "1";

  return (
    <PublicLayout>
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>{wasMatched ? "Enquiry matched" : "Enquiry received"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[#bdbdbd]">
          <p>Thank you. Your enquiry has been submitted securely.</p>
          {ref && (
            <p className="text-sm">
              Reference: <span className="font-mono text-white">{ref}</span>
            </p>
          )}
          {wasMatched && partner && (
            <p className="text-sm text-white">
              A participating provider ({partner}) has been notified and may contact you shortly.
            </p>
          )}
          {!wasMatched && (
            <p className="text-sm text-[#8c8c8c]">
              Our team is reviewing your enquiry. A relevant participating service provider may contact you.
            </p>
          )}
          <p className="text-sm text-[#8c8c8c]">
            RedFace Connect does not approve credit or debt review. Any financial decision remains with the authorised provider.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </PublicLayout>
  );
}
