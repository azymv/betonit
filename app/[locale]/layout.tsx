'use client';

import { Inter } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { useParams } from "next/navigation";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <html lang={locale}>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header locale={locale} />
        <main className="flex-grow">{children}</main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}