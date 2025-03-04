// components/referral/ReferralBadge.tsx
import { Gift } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/lib/i18n-config';

interface ReferralBadgeProps {
  locale: string;
  referrerUsername?: string;
}

export function ReferralBadge({ locale, referrerUsername }: ReferralBadgeProps) {
  const { t } = useTranslation(locale);
  
  // Получаем текст с учетом имени пользователя
  const getInvitationText = () => {
    if (referrerUsername) {
      return t('referral.invitedByUsername').replace('{username}', referrerUsername);
    }
    return t('referral.bonusApplied');
  };
  
  return (
    <Alert className="mb-4 bg-green-50 border-green-200">
      <div className="flex items-center">
        <Gift className="h-4 w-4 text-green-600 mr-2" />
        <AlertDescription className="text-green-800">
          {getInvitationText()}
        </AlertDescription>
      </div>
      <div className="mt-2 text-xs text-green-700">
        {t('referral.joinBonus')}
      </div>
    </Alert>
  );
}