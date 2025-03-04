'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Link } from 'lucide-react';
import { useAnalytics } from '@/components/analytics/analytics-provider';
import { ANALYTICS_EVENTS } from '@/lib/analytics/mixpanel';

interface ReferralLinkProps {
  locale: string;
  referralLink: string;
  referralCode: string;
  userId: string;
}

export function ReferralLink({ locale, referralLink, referralCode, userId }: ReferralLinkProps) {
  const { t } = useTranslation(locale);
  const [copied, setCopied] = useState(false);
  const { track } = useAnalytics();

  // Функция для копирования ссылки в буфер обмена
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Отслеживаем событие копирования реферальной ссылки
      track(ANALYTICS_EVENTS.REFERRAL_LINK_COPIED, {
        userId,
        referralCode,
        referralLink
      });
    });
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <Link className="h-5 w-5 mr-2" />
          {t('referral.yourLink')}
        </CardTitle>
        <CardDescription>
          {t('referral.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Input 
            value={referralLink} 
            readOnly 
            className="flex-1 font-mono text-sm"
          />
          <Button onClick={copyToClipboard} className="shrink-0">
            {copied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? t('referral.linkCopied') : t('referral.copyLink')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}