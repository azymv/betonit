'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'en';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'initial' | 'loading' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState('');
  
  const token = searchParams.get('token');
  
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Токен подтверждения отсутствует. Пожалуйста, проверьте ссылку или запросите новое письмо.');
    }
  }, [token]);
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setErrorMessage('Пожалуйста, введите email, который вы использовали при регистрации');
      return;
    }
    
    if (!password) {
      setErrorMessage('Пожалуйста, введите пароль, который вы использовали при регистрации');
      return;
    }
    
    setStatus('loading');
    
    try {
      const supabase = createClientComponentClient();
      
      // Сначала пытаемся войти с указанными учетными данными
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.error('Error signing in:', signInError);
        setStatus('error');
        setErrorMessage(`Ошибка входа: ${signInError.message}`);
        return;
      }
      
      // После успешного входа, проверяем, подтвержден ли email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email_confirmed_at) {
        // Email уже подтвержден, создаем профиль пользователя
        await createUserProfile(user.id, user.email || '', user.user_metadata);
        
        setStatus('success');
        setTimeout(() => {
          router.push(`/${locale}/profile`);
        }, 2000);
      } else {
        // Email еще не подтвержден, пытаемся подтвердить его
        // Для этого нам нужно отправить новое письмо и попросить пользователя перейти по ссылке
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/${locale}/profile`
          }
        });
        
        if (resendError) {
          console.error('Error resending verification email:', resendError);
          setStatus('error');
          setErrorMessage(`Ошибка отправки письма: ${resendError.message}`);
          return;
        }
        
        setStatus('success');
        setErrorMessage('Мы отправили новое письмо для подтверждения. Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме.');
      }
    } catch (error) {
      console.error('Unexpected error during verification:', error);
      setStatus('error');
      setErrorMessage('Произошла неожиданная ошибка. Пожалуйста, попробуйте снова позже.');
    }
  };
  
  const createUserProfile = async (
    userId: string, 
    userEmail: string, 
    metadata: {
      username?: string;
      full_name?: string;
      language?: string;
      referred_by?: string;
      [key: string]: string | undefined;
    } | null
  ) => {
    try {
      const supabase = createClientComponentClient();
      
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
            username: metadata?.username || `user_${userId.substring(0, 8)}`,
            full_name: metadata?.full_name || '',
            language: metadata?.language || locale,
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
    } catch (error) {
      console.error("Error creating user profile:", error);
      return false;
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Подтверждение email</CardTitle>
            <CardDescription>
              Пожалуйста, подождите, мы обрабатываем ваш запрос
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-center">Подтверждаем ваш email...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (status === 'success') {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Email подтвержден</CardTitle>
            <CardDescription>
              Ваш email успешно подтвержден
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200 mb-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Успешно!</AlertTitle>
              <AlertDescription>
                {errorMessage || 'Ваш email успешно подтвержден. Вы будете перенаправлены на страницу профиля.'}
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full" 
              onClick={() => router.push(`/${locale}/profile`)}
            >
              Перейти в профиль
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Ошибка подтверждения</CardTitle>
            <CardDescription>
              Произошла ошибка при подтверждении email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => router.push(`/${locale}/auth/signin`)}>
                Вернуться на страницу входа
              </Button>
              <Button variant="outline" onClick={() => router.push(`/${locale}/auth/resend-verification`)}>
                Отправить письмо повторно
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Initial state - show form to enter email and password
  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Подтверждение email</CardTitle>
          <CardDescription>
            Для завершения подтверждения email, пожалуйста, введите данные, которые вы использовали при регистрации
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              Подтвердить email
            </Button>
            
            <div className="text-center mt-4">
              <Button variant="link" onClick={() => router.push(`/${locale}/auth/signin`)}>
                Вернуться на страницу входа
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 