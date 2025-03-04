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
  
  // Функция для создания профиля пользователя, если он не существует
  const ensureUserProfile = async (
    userId: string, 
    userEmail: string, 
    userMetadata: {
      username?: string;
      full_name?: string;
      language?: string;
      referred_by?: string;
      [key: string]: string | undefined;
    } | null
  ) => {
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClientComponentClient({
      options: {
        global: {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'apikey': supabaseKey || ''
          }
        }
      }
    });
    
    // Проверяем, существует ли профиль
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError || !profile) {
      console.log("Profile not found, creating one...");
      // Создаем профиль пользователя
      const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { error: createError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: userEmail || '',
          username: userMetadata?.username || `user_${userId.substring(0, 8)}`,
          full_name: userMetadata?.full_name || '',
          language: userMetadata?.language || locale,
          referral_code: referralCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (createError) {
        console.error("Error creating profile:", createError);
        return false;
      } else {
        // Создаем начальный баланс
        const { error: balanceError } = await supabase
          .from('balances')
          .upsert({
            user_id: userId,
            amount: 1000,
            currency: 'coins',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id, currency' });
          
        if (balanceError) {
          console.error("Error creating balance:", balanceError);
          return false;
        }
      }
    }
    
    return true;
  };
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Проверяем, есть ли код в URL
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        
        // Если есть ошибка в параметрах, показываем её
        if (errorParam) {
          setStatus('error');
          setErrorMessage(decodeURIComponent(errorParam));
          return;
        }
        
        // Если нет кода, значит мы уже обработали аутентификацию на сервере
        // или пользователь попал на эту страницу напрямую
        if (!code) {
          // Проверяем, авторизован ли пользователь
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          const supabase = createClientComponentClient({
            options: {
              global: {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey || ''
                }
              }
            }
          });
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
        // Обрабатываем код на клиенте
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        console.log('Client side - API key exists:', !!supabaseKey);
        
        const supabase = createClientComponentClient({
          options: {
            global: {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'apikey': supabaseKey || ''
              }
            }
          }
        });
        
        console.log('Exchanging code for session on client side');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error("Error exchanging code for session:", exchangeError);
          setStatus('error');
          setErrorMessage(exchangeError.message);
          return;
        }
        
        // Проверяем, создался ли профиль
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Убедимся, что профиль пользователя создан
          const profileCreated = await ensureUserProfile(
            session.user.id, 
            session.user.email || '', 
            session.user.user_metadata
          );
          
          if (profileCreated) {
            setStatus('success');
          } else {
            setStatus('error');
            setErrorMessage('Не удалось создать профиль пользователя. Пожалуйста, обратитесь в поддержку.');
          }
        } else {
          setStatus('error');
          setErrorMessage('Не удалось подтвердить email. Попробуйте снова или обратитесь в поддержку.');
        }
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