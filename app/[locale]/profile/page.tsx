// app/[locale]/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { useAuth } from '@/lib/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  const { t } = useTranslation(localeStr);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Упрощенная версия для отладки
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        router.push(`/${localeStr}/auth/signin?redirectTo=/${localeStr}/profile`);
        return;
      }
      
      console.log("Loading profile for user:", user.id);
      
      setIsLoading(true);
      try {
        const supabase = createClientComponentClient<Database>();
        
        // Проверяем существование профиля
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error("Error loading profile:", profileError);
          if (profileError.code === 'PGRST116') {
            setError("Profile not found. Please try signing in again.");
          } else {
            setError(profileError.message);
          }
          setIsLoading(false);
          return;
        }
        
        console.log("Profile exists:", profileData);
        
        // Получаем баланс пользователя
        const { data: balanceData, error: balanceError } = await supabase
          .from('balances')
          .select('amount')
          .eq('user_id', user.id)
          .eq('currency', 'coins')
          .single();
          
        if (balanceError && balanceError.code !== 'PGRST116') {
          console.error("Error loading balance:", balanceError);
          throw balanceError;
        }
        
        console.log("Balance data:", balanceData);
        setBalance(balanceData?.amount || 0);
        
      } catch (err) {
        console.error('Error loading profile data:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных профиля');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadProfileData();
    }
  }, [user, router, localeStr]);
  
  // Отображение загрузки
  if (isLoading || isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Загрузка профиля...</h1>
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }
  
  // Отображение ошибки
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Ошибка</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }
  
  // Отображение профиля, если все данные загружены
  if (user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('profile.title')}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profile.personalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.email')}</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.username')}</p>
                <p className="font-medium">{user.user_metadata?.username || t('profile.notSet')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.fullName')}</p>
                <p className="font-medium">{user.user_metadata?.full_name || t('profile.notSet')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.balance')}</p>
                <p className="font-medium text-xl text-primary">
                  {balance || 0} {t('common.coins')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Если пользователь не найден и не идет загрузка
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Пользователь не авторизован</h1>
      <p>Пожалуйста, войдите в систему, чтобы просмотреть свой профиль.</p>
    </div>
  );
}