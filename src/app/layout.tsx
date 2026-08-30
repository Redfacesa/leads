import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { BRAND } from "@/lib/branding";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} | ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.subtitle,
  metadataBase: new URL(`https://${BRAND.domain}`),
  icons: {
    icon: BRAND.logoPath,
    apple: BRAND.logoPath,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
