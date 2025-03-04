'use client';

import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/forms/auth-form';
import { useTranslation } from '@/lib/i18n-config';
import { useParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const success = searchParams.get('success') === 'true';
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  
  return (
    <div className="container max-w-lg py-16 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">{t('auth.success.title')}</AlertTitle>
          <AlertDescription className="text-green-600">
            {t('auth.success.description')}
          </AlertDescription>
        </Alert>
      )}
      
      <h1 className="text-3xl font-bold mb-8 text-center">
        {t('auth.signin.title')}
      </h1>
      <AuthForm type="signin" redirectPath={redirectTo} />
    </div>
  );
}