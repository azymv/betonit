import { Metadata } from "next";
import { getTranslation } from "@/lib/i18n-config";

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: getTranslation(locale, 'nav.play') + " - BetOnIt",
    description: locale === 'ru' 
      ? "Делайте ставки на исходы событий и выигрывайте монеты"
      : "Make predictions on events and earn coins",
  };
}

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 