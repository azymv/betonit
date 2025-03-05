'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { useAuth } from '@/lib/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { User, ListTodo, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { useAnalytics } from '@/components/analytics/analytics-provider';
import { ReferralTab } from '@/components/referral/ReferralTab';

// Типы из Database
type Bet = Database['public']['Tables']['bets']['Row'];

// Определение типа для события объединенного с таблицей events
interface BetWithEvent extends Bet {
  events?: {
    title: string;
    status: string;
    result: boolean | null;
  };
}

// Определение интерфейса для статистики ставок
interface BetStatistics {
  total: number;
  won: number;
  lost: number;
  winRate: number;
}

// Интерфейс для ошибок Supabase
interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  [key: string]: unknown;
}

export default function ProfilePage() {
  const params = useParams();
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  const { t } = useTranslation(localeStr);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { /* track */ } = useAnalytics();
  
  // Создаем клиент с правильными заголовками
  const supabase = createClientComponentClient<Database>({
    options: {
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  });
  
  // Состояние компонента
  const [balance, setBalance] = useState(0);
  const [userBets, setUserBets] = useState<BetWithEvent[]>([]);
  const [betStats, setBetStats] = useState<BetStatistics>({ total: 0, won: 0, lost: 0, winRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  
  // Вычисление статистики ставок
  const calculateBetStats = (bets: BetWithEvent[]): BetStatistics => {
    const total = bets.length;
    const won = bets.filter(bet => bet.status === 'won').length;
    const lost = bets.filter(bet => bet.status === 'lost').length;
    const winRate = total > 0 ? (won / total) * 100 : 0;
    
    return { total, won, lost, winRate };
  };
  
  // Загрузка данных профиля
  const loadProfileData = async () => {
    console.log("Loading profile data for user ID:", user?.id);
    setIsLoading(true);
    setError(null);
    
    try {
      // Проверка авторизации
      if (!user) {
        console.log("No authenticated user found");
        setIsLoading(false);
        return;
      }
      
      // Загрузка данных пользователя
      console.log("Fetching user data with query params:", { id: user.id });
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Error loading user data:", profileError);
        setError({
          message: "Error loading profile",
          details: formatErrorMessage(profileError)
        });
        setIsLoading(false);
        return;
      }
      
      // Если профиль не найден, останавливаем загрузку
      if (!profileData) {
        console.log("User profile not found, stopping data load");
        setIsLoading(false);
        return;
      }
      
      // Загружаем данные баланса
      console.log("Fetching balance data for user:", user.id);
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (balanceError) {
        console.error("Error loading balance:", balanceError);
        setError({
          message: "Error loading balance",
          details: formatErrorMessage(balanceError)
        });
      } else if (balanceData) {
        setBalance(balanceData.amount);
      }
      
      // Загружаем ставки пользователя
      console.log("Fetching bets for user:", user.id);
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select(`
          *,
          events (
            title,
            status,
            result
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (betsError) {
        console.error("Error loading bets:", betsError);
        setError({
          message: "Error loading bets",
          details: formatErrorMessage(betsError)
        });
      } else if (betsData) {
        setUserBets(betsData as BetWithEvent[]);
        setBetStats(calculateBetStats(betsData as BetWithEvent[]));
      }
      
    } catch (err) {
      console.error("Error loading profile data:", err);
      setError({
        message: "Error loading profile data",
        details: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Используем useEffect для загрузки данных при монтировании компонента
  useEffect(() => {
    if (user && !isAuthLoading) {
      loadProfileData();
    }
  }, [user, isAuthLoading]);
  
  // Форматирование даты
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
  
  // Форматирование числа
  const formatNumber = (num: number) => {
    return num.toLocaleString(localeStr === 'en' ? 'en-US' : 'ru-RU');
  };
  
  // Получение статуса ставки
  const getBetStatusBadge = (bet: BetWithEvent) => {
    const event = bet.events || { status: '', result: null };
    
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
  
  // Показываем состояние загрузки
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-lg font-medium mb-2">
          {isAuthLoading ? "Проверка авторизации..." : t('common.loading')}
        </p>
        <p className="text-sm text-muted-foreground">
          Пожалуйста, подождите...
        </p>
      </div>
    );
  }
  
  // Отображение ошибки
  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>{t('errors.title')}</AlertTitle>
          <AlertDescription>
            {error.message}
            {error.details && (
              <>
                <br />
                <strong>Подробности:</strong> {error.details}
              </>
            )}
          </AlertDescription>
        </Alert>
        
        <div className="flex space-x-4">
          <Button 
            onClick={() => {
              setError(null);
              loadProfileData();
            }}
            className="flex-1"
          >
            Повторить
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push(`/${localeStr}`)}
            className="flex-1"
          >
            На главную
          </Button>
        </div>
      </div>
    );
  }
  
  // Пользователь авторизован, но профиль не создан
  if (!isLoading && user && !isAuthLoading) {
    // Проверяем загружены ли данные
    const profileLoaded = userBets !== undefined || balance !== undefined;
    
    // Если данные загружены, но нет ставок и баланс равен 0, показываем обычный профиль
    // без кнопки создания профиля
    if (profileLoaded) {
      // Просто продолжаем отображение профиля ниже
    } else {
      // Если профиль не загружен, показываем сообщение об ошибке
      return (
        <div className="container py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Ошибка загрузки профиля</AlertTitle>
            <AlertDescription>
              Не удалось загрузить ваш профиль. Пожалуйста, попробуйте войти снова или обратитесь в поддержку.
            </AlertDescription>
          </Alert>
          <Button 
            className="mt-4"
            onClick={() => router.push(`/${localeStr}/auth/signin`)}
          >
            Вернуться на страницу входа
          </Button>
        </div>
      );
    }
  }
  
  // Обычное отображение профиля
  return (
    <div className="container py-8">
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
        {/* Левая колонка с информацией о пользователе и статистикой */}
        <div>
          {/* Карточка профиля */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.personalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.email')}</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.username')}</p>
                  <p className="font-medium">{user?.user_metadata?.username || t('profile.notSet')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.fullName')}</p>
                  <p className="font-medium">{user?.user_metadata?.full_name || t('profile.notSet')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.balance')}</p>
                  <p className="font-medium text-xl text-primary">
                    {formatNumber(balance)} {t('common.coins')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Реферальная программа */}
          <div className="mt-6">
            <div className="relative min-h-[14rem] rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3 overflow-hidden">
              {/* Custom always-active glowing effect */}
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden">
                {/* Background gradient layer */}
                <div 
                  className="absolute inset-[-20%] rounded-[inherit]"
                  style={{
                    background: `
                      radial-gradient(circle, #dd7bbb 10%, #dd7bbb00 20%),
                      radial-gradient(circle at 40% 40%, #d79f1e 5%, #d79f1e00 15%),
                      radial-gradient(circle at 60% 60%, #5a922c 10%, #5a922c00 20%), 
                      radial-gradient(circle at 40% 60%, #4c7894 10%, #4c789400 20%)
                    `,
                    backgroundSize: '400% 400%',
                    animation: 'gradientAnimation 15s ease infinite'
                  }}
                />
                
                {/* Rotating border with extended size to prevent gaps */}
                <div 
                  className="absolute inset-[-15px] rounded-[inherit]"
                  style={{
                    animation: 'rotate 10s linear infinite',
                    background: `conic-gradient(from 0deg at 50% 50%, 
                      #dd7bbb 0%, 
                      #d79f1e 25%, 
                      #5a922c 50%, 
                      #4c7894 75%, 
                      #dd7bbb 100%
                    )`,
                    filter: 'blur(12px)'
                  }}
                />
                
                {/* Additional fill layer to ensure no gaps */}
                <div 
                  className="absolute inset-[-2px] rounded-[inherit]"
                  style={{
                    background: `conic-gradient(from 0deg at 50% 50%, 
                      #dd7bbb 0%, 
                      #d79f1e 25%, 
                      #5a922c 50%, 
                      #4c7894 75%, 
                      #dd7bbb 100%
                    )`,
                    filter: 'blur(5px)',
                    opacity: 0.8
                  }}
                />
                
                {/* Sharp border overlay */}
                <div 
                  className="absolute inset-0 rounded-[inherit]"
                  style={{
                    animation: 'rotate 10s linear infinite',
                    background: `conic-gradient(from 0deg at 50% 50%, 
                      #dd7bbb 0%, 
                      #d79f1e 25%, 
                      #5a922c 50%, 
                      #4c7894 75%, 
                      #dd7bbb 100%
                    )`,
                    opacity: 0.7
                  }}
                />
              </div>
              
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-xl">{t('referral.title')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ReferralTab userId={user!.id} locale={localeStr} />
                </CardContent>
              </div>
            </div>
          </div>
          
          {/* Статистика ставок */}
          {betStats.total > 0 && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('profile.stats.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{betStats.total}</p>
                    <p className="text-sm text-muted-foreground">{t('profile.stats.total')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{betStats.won}</p>
                    <p className="text-sm text-muted-foreground">{t('profile.stats.won')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{betStats.lost}</p>
                    <p className="text-sm text-muted-foreground">{t('profile.stats.lost')}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">{t('profile.stats.accuracy')}</p>
                  <div className="w-full bg-slate-200 h-2 rounded-full">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${betStats.winRate}%` }}
                    />
                  </div>
                  <p className="text-sm mt-1">
                    {Math.round(betStats.winRate)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Правая колонка с вкладками */}
        <div>
          <Tabs defaultValue="bets" className="w-full">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    {t('profile.activity')}
                  </CardTitle>
                  <TabsList>
                    <TabsTrigger value="bets">
                      {t('profile.bets')}
                    </TabsTrigger>
                    <TabsTrigger value="transactions">
                      {t('profile.transactions')}
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                {/* Вкладка со ставками */}
                <TabsContent value="bets" className="mt-0">
                  {userBets.length === 0 ? (
                    <div className="text-center py-4">
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
                </TabsContent>
                
                {/* Вкладка с транзакциями */}
                <TabsContent value="transactions" className="mt-0">
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">{t('profile.comingSoon')}</p>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Вспомогательная функция для форматирования сообщений об ошибках
const formatErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as SupabaseError;
    return supabaseError.message || supabaseError.details || JSON.stringify(error);
  }
  return String(error);
};