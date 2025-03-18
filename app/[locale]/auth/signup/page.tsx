'use client';

import { AuthForm } from '@/components/forms/auth-form';
import { useTranslation } from '@/lib/i18n-config';
import { useParams, useSearchParams } from 'next/navigation';

export default function SignUpPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  
  // Получаем адрес перенаправления из URL параметров
  const redirectTo = searchParams.get('redirectTo') || '/';
  
  return (
    <div className="container max-w-lg py-16 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {t('auth.signup.title')}
      </h1>
      <AuthForm type="signup" redirectPath={redirectTo} />
    </div>
  );
}