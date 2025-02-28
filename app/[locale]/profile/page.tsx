'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { useAuth } from '@/lib/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { Loader2, User, Wallet, ListTodo } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  const { t } = useTranslation(localeStr);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [userBets, setUserBets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        router.push(`/${localeStr}/auth/signin?redirectTo=/${localeStr}/profile`);
        return;
      }
      
      setIsLoading(true);
      try {
        const supabase = createClientComponentClient<Database>();
        
        // Получаем баланс пользователя
        const { data: balanceData, error: balanceError } = await supabase
          .from('balances')
          .select('amount')
          .eq('user_id', user.id)
          .eq('currency', 'coins')
          .single();
          
        if (balanceError && balanceError.code !== 'PGRST116') {
          throw balanceError;
        }
        
        setBalance(balanceData?.amount || 0);
        
        // Получаем ставки пользователя
        const { data: betsData, error: betsError } = await supabase
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
          .order('created_at', { ascending: false });
          
        if (betsError) {
          throw betsError;
        }
        
        setUserBets(betsData || []);
      } catch (err) {
        console.error('Error loading profile data:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных профиля');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfileData();
  }, [user, router, localeStr]);
  
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
  const getBetStatusBadge = (bet: any) => {
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
  
  if (!user) {
    return null; // Перенаправление на страницу входа уже должно было произойти
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
          
          {/* Вкладка с транзакциями (будет реализована позже) */}
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