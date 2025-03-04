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
import { User, Wallet, ListTodo, Loader2, AlertCircle, BarChart3 } from 'lucide-react';

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

export default function ProfilePage() {
  const params = useParams();
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  const { t } = useTranslation(localeStr);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const supabase = createClientComponentClient<Database>();
  
  // Состояние компонента
  const [balance, setBalance] = useState(0);
  const [userBets, setUserBets] = useState<BetWithEvent[]>([]);
  const [betStats, setBetStats] = useState<BetStatistics>({ total: 0, won: 0, lost: 0, winRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  
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
    console.log("Loading profile data");
    setIsLoading(true);
    setError(null);
    
    try {
      // Проверка авторизации
      if (!user) {
        console.log("No user found, redirecting to sign in");
        router.push(`/${localeStr}/auth/signin`);
        return;
      }
      
      // Проверка наличия профиля в базе
      const { error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // Если профиль не существует, показываем кнопку создания
      if (profileError && profileError.code === 'PGRST116') {
        console.log("Profile not found, showing create button");
        setIsLoading(false);
        return;
      }
      
      // Если есть другая ошибка при проверке профиля
      if (profileError) {
        console.error("Error checking profile:", profileError);
        setError({
          message: "Error loading profile",
          details: profileError.message
        });
        setIsLoading(false);
        return;
      }
      
      // Если профиль существует, загружаем все данные
      // Загружаем данные баланса
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', user.id)
        .eq('currency', 'coins')
        .single();
      
      if (balanceError) {
        console.error("Error loading balance:", balanceError);
      } else if (balanceData) {
        setBalance(balanceData.amount);
      }
      
      // Загружаем данные ставок
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select(`
          id, amount, potential_payout, created_at, status, user_id, event_id, prediction,
          events (title, status, result)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (betsError) {
        console.error("Error loading bets:", betsError);
      } else if (betsData) {
        const typedBets = betsData as unknown as BetWithEvent[];
        setUserBets(typedBets);
        setBetStats(calculateBetStats(typedBets));
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
  
  // Создание профиля
  const createProfile = async () => {
    if (!user) return;
    
    setIsCreatingProfile(true);
    
    try {
      // Сначала проверяем, существует ли уже пользователь
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 - это код ошибки "не найдено", который мы ожидаем
        console.error("Error checking if user exists:", checkError);
        setError({
          message: "Error checking user profile",
          details: checkError.message
        });
        return;
      }
      
      if (existingUser) {
        console.log("User profile already exists, updating instead of creating");
        // Обновляем существующий профиль
        const { error: updateError } = await supabase
          .from('users')
          .update({
            username: user.user_metadata?.username || `user_${user.id.substring(0, 8)}`,
            full_name: user.user_metadata?.full_name || '',
            language: localeStr,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.error("Error updating user profile:", updateError);
          setError({
            message: "Error updating profile",
            details: updateError.message
          });
          return;
        }
      } else {
        // Создаем новую запись в таблице users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            username: user.user_metadata?.username || `user_${user.id.substring(0, 8)}`,
            full_name: user.user_metadata?.full_name || '',
            language: localeStr,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (userError) {
          console.error("Error creating user profile:", userError);
          setError({
            message: "Error creating profile",
            details: userError.message
          });
          return;
        }
      }
      
      // Проверяем, существует ли уже баланс
      const { data: existingBalance, error: balanceCheckError } = await supabase
        .from('balances')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
      
      if (balanceCheckError && balanceCheckError.code !== 'PGRST116') {
        console.error("Error checking if balance exists:", balanceCheckError);
        setError({
          message: "Error checking balance",
          details: balanceCheckError.message
        });
        return;
      }
      
      if (!existingBalance) {
        // Создаем начальный баланс только если его еще нет
        const { error: balanceError } = await supabase
          .from('balances')
          .insert({
            user_id: user.id,
            amount: 1000,
            currency: 'coins',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (balanceError) {
          console.error("Error creating balance:", balanceError);
          setError({
            message: "Error creating balance",
            details: balanceError.message
          });
          return;
        }
      }
      
      // Перезагружаем данные
      await loadProfileData();
    } catch (err) {
      console.error("Error in profile creation:", err);
      setError({
        message: "Error in profile creation",
        details: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };
  
  // Загрузка данных при первом рендере
  useEffect(() => {
    if (!isAuthLoading && user) {
      loadProfileData();
    } else if (!isAuthLoading && !user) {
      router.push(`/${localeStr}/auth/signin`);
    }
  }, [user, isAuthLoading, router, localeStr]);
  
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
  
  // Отображение экрана создания профиля
  const renderProfileCreation = () => (
    <div className="container py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('profile.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            Для доступа к профилю необходимо завершить регистрацию. Нажмите кнопку ниже, чтобы создать профиль.
          </p>
          <Button 
            onClick={createProfile} 
            disabled={isCreatingProfile}
            className="w-full"
          >
            {isCreatingProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              "Создать профиль"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
  
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
  
  // Показываем ошибку
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-6 max-w-xl">
          <Alert variant="destructive" className="mb-4">
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
      </div>
    );
  }
  
  // Пользователь авторизован, но профиль не создан
  if (!isLoading && user && supabase && !userBets.length) {
    return renderProfileCreation();
  }
  
  // Обычное отображение профиля
  return (
    <div className="container py-8">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        {/* Левая колонка с информацией о пользователе и статистикой */}
        <div className="md:col-span-1">
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
        <div className="md:col-span-2">
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
    </div>
  );
}