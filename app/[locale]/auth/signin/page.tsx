'use client';

import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/forms/auth-form';
import { useTranslation } from '@/lib/i18n-config';
import { useParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  
  return (
    <div className="container max-w-lg py-16 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {t('auth.signin.title')}
      </h1>
      <AuthForm type="signin" redirectPath={redirectTo} />
    </div>
  );
}