'use client';

import { Poppins, Libre_Caslon_Text } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { useParams } from "next/navigation";

// Инициализируем шрифты
const poppins = Poppins({ 
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
});

const libreCaslon = Libre_Caslon_Text({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-libre-caslon'
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <html lang={locale}>
      <body className={`${poppins.variable} ${libreCaslon.variable} font-poppins min-h-screen flex flex-col`}>
        <Header locale={locale} />
        <main className="flex-grow">{children}</main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}