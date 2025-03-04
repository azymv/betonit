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
    const handleCallback = async () => {
      try {
        // Проверяем, есть ли код в URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        // Если есть ошибка в параметрах, показываем её
        if (error) {
          setStatus('error');
          setErrorMessage(decodeURIComponent(error));
          return;
        }
        
        // Если нет кода, значит мы уже обработали аутентификацию на сервере
        // или пользователь попал на эту страницу напрямую
        if (!code) {
          // Проверяем, авторизован ли пользователь
          const supabase = createClientComponentClient();
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // Если пользователь авторизован, считаем это успехом
            setStatus('success');
          } else {
            // Если пользователь не авторизован, показываем ошибку
            setStatus('error');
            setErrorMessage('Не удалось подтвердить email. Попробуйте снова или обратитесь в поддержку.');
          }
          return;
        }
        
        // Если код есть, значит middleware не перенаправил запрос на серверный обработчик
        // Это может произойти, если пользователь напрямую перешел по ссылке
        // Перенаправляем на серверный обработчик
        window.location.href = `/auth/callback?code=${code}&redirect_to=/${locale}/profile`;
      } catch (err) {
        console.error("Error in callback handling:", err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    handleCallback();
  }, [searchParams, router, locale]);
  
  // Обработчики для кнопок
  const handleGoToSignIn = () => {
    router.push(`/${locale}/auth/signin`);
  };
  
  const handleGoToHome = () => {
    router.push(`/${locale}`);
  };
  
  const handleGoToProfile = () => {
    router.push(`/${locale}/profile`);
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
            <Button onClick={handleGoToProfile}>Перейти в профиль</Button>
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
          <Button onClick={handleGoToSignIn}>Попробовать снова</Button>
          <Button variant="outline" onClick={handleGoToHome}>На главную</Button>
        </div>
      </div>
    </div>
  );
}