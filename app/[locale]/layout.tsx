import "../globals.css";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { Poppins, Roboto, Libre_Caslon_Text } from 'next/font/google';
import type { Metadata } from "next";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['cyrillic', 'latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

const libreCaslon = Libre_Caslon_Text({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-libre-caslon',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BetOnIt - Predict and Win",
  description: "Make predictions on events and earn coins",
};

export default function RootLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode;
  params: { locale: string }
}) {
  const mainFont = params.locale === 'ru' ? roboto : poppins;

  return (
    <html lang={params.locale} className={`${mainFont.variable} ${libreCaslon.variable}`}>
      <body className={`${mainFont.className} min-h-screen flex flex-col`}>
        <Header locale={params.locale} />
        <main className="flex-grow">{children}</main>
        <Footer locale={params.locale} />
      </body>
    </html>
  );
}