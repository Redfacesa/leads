import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ApplySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Enquiry received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[#bdbdbd]">
          <p>Thank you. Your enquiry has been submitted securely.</p>
          {ref && (
            <p className="text-sm">
              Reference: <span className="font-mono text-white">{ref}</span>
            </p>
          )}
          <p className="text-sm text-[#8c8c8c]">
            A relevant participating service provider may contact you. RedFace Connect does not approve credit or debt review.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
