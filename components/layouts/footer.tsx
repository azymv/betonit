"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n-config";

export function Footer({ locale }: { locale: string }) {
  const { t } = useTranslation(locale);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">BetOnIt</h3>
            <p className="text-sm text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('footer.navigation')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}`} className="text-sm hover:underline">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/events`} className="text-sm hover:underline">
                  {t('nav.events')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/leaderboard`} className="text-sm hover:underline">
                  {t('nav.leaderboard')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('footer.account')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/profile`} className="text-sm hover:underline">
                  {t('nav.profile')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/profile/bets`} className="text-sm hover:underline">
                  {t('footer.myBets')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/profile/balance`} className="text-sm hover:underline">
                  {t('footer.balance')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/terms`} className="text-sm hover:underline">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-sm hover:underline">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          &copy; {currentYear} BetOnIt. {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}