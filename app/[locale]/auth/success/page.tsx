// app/[locale]/auth/success/page.tsx
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { AuthForm } from '@/components/forms/auth-form';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';

export default function VerificationSuccessPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  const router = useRouter();
  
  // Проверка сессии и перенаправление на профиль, если пользователь уже авторизован
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClientComponentClient<Database>();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Session exists, redirecting to profile");
          // Добавляем небольшую задержку для стабильности
          setTimeout(() => {
            router.push(`/${locale}/profile`);
          }, 1000);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    checkSession();
  }, [router, locale]);
  
  const handleGoToProfile = () => {
    router.push(`/${locale}/profile`);
  };
  
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
        
        <Button 
          onClick={handleGoToProfile} 
          className="mb-6"
        >
          {t('auth.success.goToProfile') || 'Go to Profile'}
        </Button>
      </div>
      
      <AuthForm type="signin" />
    </div>
  );
}