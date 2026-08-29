import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedFace Connect",
  description: "Connecting South Africans with relevant financial service providers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
