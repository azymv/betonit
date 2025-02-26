import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n";

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
  // Перенаправляем на версию с языком по умолчанию
  redirect(`/${defaultLocale}`);
  
  // Этот код не будет выполнен из-за перенаправления выше
  return (
    <html lang={defaultLocale}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}