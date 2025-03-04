'use client';

import { useTranslation } from '@/lib/i18n-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Coins, Target } from 'lucide-react';

interface ReferralStatsProps {
  locale: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
}

export function ReferralStats({ locale, totalReferrals, activeReferrals, totalEarned }: ReferralStatsProps) {
  const { t } = useTranslation(locale);

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">
          {t('referral.stats.title')}
        </CardTitle>
        <CardDescription>
          {t('referral.howItWorks')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Количество приглашенных */}
          <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
            <Users className="h-8 w-8 text-primary mb-2" />
            <span className="text-2xl font-bold">{totalReferrals}</span>
            <span className="text-sm text-muted-foreground">{t('referral.stats.invited')}</span>
          </div>
          
          {/* Активные рефералы */}
          <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
            <Target className="h-8 w-8 text-primary mb-2" />
            <span className="text-2xl font-bold">{activeReferrals}</span>
            <span className="text-sm text-muted-foreground">{t('referral.stats.active')}</span>
          </div>
          
          {/* Заработано монет */}
          <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
            <Coins className="h-8 w-8 text-primary mb-2" />
            <span className="text-2xl font-bold">{totalEarned}</span>
            <span className="text-sm text-muted-foreground">{t('referral.stats.earned')}</span>
          </div>
        </div>
        
        {/* Описание механики программы */}
        <div className="mt-6 space-y-2">
          <h4 className="font-semibold">{t('referral.howItWorks')}</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
            <li>{t('referral.step1')}</li>
            <li>{t('referral.step2')}</li>
            <li>{t('referral.step3')}</li>
            <li>{t('referral.step4')}</li>
          </ol>
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-md text-sm space-y-1">
            <p className="text-green-700 dark:text-green-300">{t('referral.inviterBonus')}</p>
            <p className="text-green-700 dark:text-green-300">{t('referral.invitedBonus')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}