"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DISCLAIMERS } from "@/lib/branding";

interface Listing {
  id: string;
  price: number;
  exclusive: boolean;
  preview_province: string | null;
  preview_income_band: string | null;
  preview_debt_band: string | null;
  preview_score: number | null;
  verified: boolean;
  listed_at: string;
  connect_lead_categories?: { name: string } | { name: string }[];
}

export default function ClientMarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/marketplace");
    if (res.ok) {
      const data = await res.json();
      setListings(data.listings ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function purchase(listingId: string) {
    setPurchasing(listingId);
    setMessage(null);
    const res = await fetch("/api/marketplace/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json();
    setPurchasing(null);
    if (!res.ok) {
      setMessage(data.error ?? "Purchase failed");
      return;
    }
    setMessage("Lead purchased. Open it in My Leads.");
    load();
  }

  function categoryName(listing: Listing): string {
    const cat = listing.connect_lead_categories;
    if (!cat) return "Lead";
    return Array.isArray(cat) ? cat[0]?.name ?? "Lead" : cat.name;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Lead marketplace</h2>
        <p className="text-[#8c8c8c]">Browse available inventory. Full contact details unlock after purchase.</p>
      </div>

      <p className="text-xs text-[#8c8c8c]">{DISCLAIMERS.marketplace}</p>

      {message && (
        <div className="rounded-lg border border-[#262626] bg-[#111] p-4 text-sm text-white">{message}</div>
      )}

      {loading ? (
        <p className="text-[#8c8c8c]">Loading inventory...</p>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-[#8c8c8c]">
            No leads available right now. Check back soon or contact us for a custom campaign.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader>
                <CardTitle className="text-base">{categoryName(listing)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[#bdbdbd]">
                <p><span className="text-[#8c8c8c]">Province:</span> {listing.preview_province ?? "—"}</p>
                {listing.preview_income_band && <p><span className="text-[#8c8c8c]">Income:</span> {listing.preview_income_band}</p>}
                {listing.preview_debt_band && <p><span className="text-[#8c8c8c]">Debt:</span> {listing.preview_debt_band}</p>}
                <p><span className="text-[#8c8c8c]">Score:</span> {listing.preview_score ?? "—"}/100</p>
                <p><span className="text-[#8c8c8c]">Verified:</span> {listing.verified ? "Yes" : "Pending"}</p>
                <p><span className="text-[#8c8c8c]">Listed:</span> {formatDate(listing.listed_at)}</p>
                {listing.exclusive && <p className="text-[#dc2626] text-xs font-medium">Exclusive lead</p>}
                <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
                  <p className="text-xl font-bold text-white">{formatCurrency(Number(listing.price))}</p>
                  <Button size="sm" disabled={purchasing === listing.id} onClick={() => purchase(listing.id)}>
                    {purchasing === listing.id ? "Processing..." : "Purchase lead"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
