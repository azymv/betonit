import { Inter } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata = {
  title: "BetOnIt - Predict and Win",
  description: "Make predictions on events and earn coins"
};

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale;

  return (
    <html lang={locale}>
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header locale={locale} />
        <main className="flex-grow">{children}</main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}