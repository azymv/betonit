'use client';

import "../globals.css";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { useParams } from "next/navigation";
import { Poppins, Libre_Caslon_Text } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const libreCaslon = Libre_Caslon_Text({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-libre-caslon',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <html lang={locale} className={`${poppins.variable} ${libreCaslon.variable}`}>
      <body className={`min-h-screen flex flex-col font-poppins`}>
        <Header locale={locale} />
        <main className="flex-grow">{children}</main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}