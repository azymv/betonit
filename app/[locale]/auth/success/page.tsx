'use client';

import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { AuthForm } from '@/components/forms/auth-form';
import { CheckCircle } from 'lucide-react';

export default function VerificationSuccessPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  
  return (
    <div className="container max-w-lg py-16 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">
          {t('auth.success.title')}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t('auth.success.description')}
        </p>
      </div>
      
      <AuthForm type="signin" />
    </div>
  );
}