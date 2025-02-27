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
  preload: true,
  adjustFontFallback: true,
});

const roboto = Roboto({
  subsets: ['cyrillic', 'latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const libreCaslon = Libre_Caslon_Text({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-libre-caslon',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${mainFont.className} min-h-screen flex flex-col antialiased`}>
        <Header locale={params.locale} />
        <main className="flex-grow">{children}</main>
        <Footer locale={params.locale} />
      </body>
    </html>
  );
}