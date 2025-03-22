"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n-config";

export function Footer({ locale }: { locale: string }) {
  const { t } = useTranslation(locale);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">Predict and earn</h3>
            <p className="text-sm text-gray-300 mt-4">
              © {currentYear} BetOnIt. All rights reserved.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">{t('footer.navigation')}</h4>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}`} className="hover:text-gray-300 transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/events`} className="hover:text-gray-300 transition-colors">
                  {t('nav.events')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/leaderboard`} className="hover:text-gray-300 transition-colors">
                  {t('nav.leaderboard')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">{t('footer.account')}</h4>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/profile`} className="hover:text-gray-300 transition-colors">
                  {t('profile.dashboard')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/profile/social`} className="hover:text-gray-300 transition-colors">
                  {t('profile.social')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/profile/settings`} className="hover:text-gray-300 transition-colors">
                  {t('profile.settings')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/terms`} className="hover:text-gray-300 transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="hover:text-gray-300 transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-6 text-center">
          <h1 className="text-8xl md:text-8xl font-normal mb-8 text-white text-center font-serif">BetOnIt</h1>
        </div>
      </div>
    </footer>
  );
}