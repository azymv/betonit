'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'en';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Получаем код из URL
        const code = searchParams.get('code');
        
        if (!code) {
          setStatus('error');
          setErrorMessage('No confirmation code found in URL');
          return;
        }
        
        // Создаем клиент Supabase
        const supabase = createClientComponentClient();
        
        // Обмениваем код на сессию
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error("Error exchanging code for session:", error);
          setStatus('error');
          setErrorMessage(error.message);
          return;
        }
        
        if (!data.session || !data.user) {
          console.error("No session or user after code exchange");
          setStatus('error');
          setErrorMessage('Failed to get user session');
          return;
        }
        
        console.log("Email confirmed successfully for user:", data.user.id);
        
        // Создаем профиль пользователя
        try {
          // Генерируем уникальный код
          const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
          
          // Создаем запись пользователя
          const { error: userError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email || '',
              username: data.user.user_metadata?.username || `user_${data.user.id.substring(0, 8)}`,
              full_name: data.user.user_metadata?.full_name || '',
              language: data.user.user_metadata?.language || locale,
              referral_code: referralCode,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
          
          if (userError) {
            console.error("Error creating user profile:", userError);
            // Продолжаем выполнение даже при ошибке
          } else {
            console.log("User profile created successfully");
            
            // Создаем начальный баланс
            const { error: balanceError } = await supabase
              .from('balances')
              .upsert({
                user_id: data.user.id,
                amount: 1000,
                currency: 'coins',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id, currency' });
            
            if (balanceError) {
              console.error("Error creating balance:", balanceError);
            } else {
              console.log("Balance created successfully");
            }
          }
        } catch (profileError) {
          console.error("Error creating profile:", profileError);
          // Продолжаем даже при ошибке создания профиля
        }
        
        // Устанавливаем успешный статус
        setStatus('success');
      } catch (err) {
        console.error("Error in email confirmation:", err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, router, locale]);
  
  // Обработчики для кнопок
  const handleGoToSignIn = () => {
    router.push(`/${locale}/auth/signin`);
  };
  
  const handleGoToHome = () => {
    router.push(`/${locale}`);
  };
  
  // Рендеринг состояний
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Подтверждаем ваш email...</h2>
          <p>Пожалуйста, подождите, это может занять несколько секунд.</p>
        </div>
      </div>
    );
  }
  
  if (status === 'success') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center max-w-md p-6 bg-white rounded shadow-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Email подтвержден!</h2>
          <p className="mb-6">Ваш email успешно подтвержден. Теперь вы можете войти в свой аккаунт.</p>
          <div className="flex flex-col space-y-2">
            <Button onClick={handleGoToSignIn}>Войти в аккаунт</Button>
            <Button variant="outline" onClick={handleGoToHome}>На главную</Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Состояние ошибки
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center max-w-md p-6 bg-white rounded shadow-md">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-4">Произошла ошибка</h2>
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Ошибка подтверждения</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="flex flex-col space-y-2">
          <Button onClick={handleGoToHome}>На главную</Button>
        </div>
      </div>
    </div>
  );
}