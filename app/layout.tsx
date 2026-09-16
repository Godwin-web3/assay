import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assay",
  description:
    "Read the mint. Classify the issuer. Do not treat the ticker as the share.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
