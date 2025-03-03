// app/[locale]/profile/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { useAuth } from '@/lib/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { Loader2, User, Wallet, ListTodo } from 'lucide-react';

// Определение типа для события объединенного с таблицей events
interface BetWithEvent {
  id: string;
  user_id: string;
  event_id: string;
  amount: number;
  currency: string;
  prediction: boolean;
  odds: number;
  potential_payout: number;
  platform_fee: number;
  status: "pending" | "active" | "won" | "lost" | "cancelled";
  created_at: string;
  updated_at: string | null;
  events?: {
    title: string;
    status: string;
    result: boolean | null;
  };
}

export default function ProfilePage() {
  const params = useParams();
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  const { t } = useTranslation(localeStr);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [userBets, setUserBets] = useState<BetWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Функция загрузки данных профиля
  const loadProfileData = useCallback(async () => {
    // Если пользователь не авторизован, прекращаем выполнение
    if (!user) {
      router.push(`/${localeStr}/auth/signin?redirectTo=/${localeStr}/profile`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClientComponentClient<Database>();
      
      // Загружаем данные пользователя
      const { error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Если профиль не существует, создаем его через API
      if (profileError && profileError.code === 'PGRST116') {
        console.log('Profile not found, creating...');
        
        try {
          const response = await fetch('/api/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              username: user.user_metadata?.username,
              fullName: user.user_metadata?.full_name,
              language: user.user_metadata?.language,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to create profile:', errorData);
            setError('Failed to create user profile');
            setIsLoading(false);
            return;
          }
          
          // Даем время БД на обновление
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Повторно пытаемся загрузить данные после создания профиля
          const { error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (retryError) {
            console.error('Error getting user profile after creation:', retryError);
            throw new Error('Failed to load user profile');
          }
        } catch (e) {
          console.error('Error creating profile:', e);
          setError('Error creating user profile');
          setIsLoading(false);
          return;
        }
      } else if (profileError) {
        console.error('Error loading user profile:', profileError);
        throw new Error('Failed to load user profile');
      }
      
      // Загружаем данные параллельно
      try {
        const [balanceResponse, betsResponse] = await Promise.all([
          // Загрузка баланса
          supabase
            .from('balances')
            .select('amount')
            .eq('user_id', user.id)
            .eq('currency', 'coins')
            .single(),
            
          // Загрузка ставок
          supabase
            .from('bets')
            .select(`
              *,
              events:event_id (
                title,
                status,
                result
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        ]);
        
        // Обрабатываем результаты
        if (!balanceResponse.error || balanceResponse.error.code === 'PGRST116') {
          setBalance(balanceResponse.data?.amount || 0);
        } else {
          console.error('Error loading balance:', balanceResponse.error);
        }
        
        if (!betsResponse.error) {
          setUserBets(betsResponse.data || []);
        } else {
          console.error('Error loading bets:', betsResponse.error);
        }
      } catch (e) {
        console.error('Error loading profile data:', e);
        setError('Failed to load profile data');
      }
      
    } catch (e) {
      console.error('Exception in loadProfileData:', e);
      setError((e as Error).message || 'Error loading profile data');
    } finally {
      setIsLoading(false);
    }
  }, [user, router, localeStr]);
  
  // Загружаем данные профиля при монтировании компонента
  useEffect(() => {
    // Запускаем загрузку только если пользователь загружен и авторизован
    if (!isAuthLoading && user) {
      loadProfileData();
    }
  }, [loadProfileData, user, isAuthLoading]);
  
  // Форматируем дату
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(localeStr === "en" ? "en-US" : "ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  // Форматируем число
  const formatNumber = (num: number) => {
    return num.toLocaleString(localeStr === 'en' ? 'en-US' : 'ru-RU');
  };
  
  // Получаем статус ставки с правильным форматом
  const getBetStatusBadge = (bet: BetWithEvent) => {
    const event = bet.events;
    
    if (!event) return null;
    
    if (bet.status === 'won') {
      return <Badge className="bg-green-500">{t('profile.bets.won')}</Badge>;
    } else if (bet.status === 'lost') {
      return <Badge variant="destructive">{t('profile.bets.lost')}</Badge>;
    } else if (event.status === 'resolved') {
      return <Badge variant="outline">{t('profile.bets.waiting')}</Badge>;
    } else {
      return <Badge variant="secondary">{t('profile.bets.active')}</Badge>;
    }
  };
  
  // Отображение загрузки
  if (isLoading || isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        
        <div className="grid gap-8">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  // Отображение ошибки
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <Button onClick={() => {
          setError(null);
          loadProfileData();
        }}>
          Retry Loading
        </Button>
      </div>
    );
  }
  
  // Перенаправление при отсутствии пользователя
  if (!user) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('profile.title')}</h1>
      
      <div className="grid gap-8">
        {/* Карточка профиля */}
        <Card>
          <CardHeader className="pb-3">
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
                  {formatNumber(balance || 0)} {t('common.coins')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Вкладки */}
        <Tabs defaultValue="bets">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bets" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              {t('profile.myBets')}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {t('profile.transactions')}
            </TabsTrigger>
          </TabsList>
          
          {/* Вкладка со ставками */}
          <TabsContent value="bets">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.betsHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {userBets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('profile.noBets')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userBets.map((bet) => (
                      <div key={bet.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{bet.events?.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {t('events.yourBet')}: {bet.prediction ? t('common.yes') : t('common.no')}
                            </p>
                          </div>
                          <div className="text-right">
                            {getBetStatusBadge(bet)}
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(bet.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{t('events.amount')}: {formatNumber(bet.amount)} {t('common.coins')}</span>
                          <span>
                            {t('events.potentialWinnings')}: {formatNumber(bet.potential_payout)} {t('common.coins')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Вкладка с транзакциями */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.transactionsHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">{t('profile.comingSoon')}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}