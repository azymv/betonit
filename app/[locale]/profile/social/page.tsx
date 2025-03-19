'use client';

import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReferralTab } from '@/components/referral/ReferralTab';
import { Share2, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';

export default function SocialPage() {
  const params = useParams();
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  const { t } = useTranslation(localeStr);
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t("profile.social") || "Social"}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 text-white border-gray-800">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-lg flex items-center">
              <Share2 className="h-5 w-5 mr-2 text-primary" />
              {t("referral.title") || "Referral Program"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {user && <ReferralTab userId={user.id} locale={localeStr} />}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 text-white border-gray-800">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-lg flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
              {t("profile.social_features") || "Coming Soon"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-400">
              {t("profile.social_features_description") || "More social features will be added soon. Stay tuned!"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 