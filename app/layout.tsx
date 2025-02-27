import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { defaultLocale } from "@/lib/i18n-config";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "BetOnIt - Predict and Win",
  description: "Make predictions on events and earn coins",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={defaultLocale}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}