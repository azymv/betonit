'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { useAuth } from '@/lib/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { User, Wallet, ListTodo, Loader2, Copy, CheckCircle2, Users, BarChart3 } from 'lucide-react';

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
  
  // Используем useRef для отслеживания монтирования компонента
  const isMounted = useRef(true);
  // Отслеживаем, была ли уже попытка загрузки данных
  const dataLoadAttempted = useRef(false);
  
  const [balance, setBalance] = useState<number | null>(null);
  const [userBets, setUserBets] = useState<BetWithEvent[]>([]);
  const [betStats, setBetStats] = useState<BetStatistics | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string>('');
  
  // Обновляем реферальную ссылку при изменении кода
  useEffect(() => {
    if (referralCode && typeof window !== 'undefined') {
      setReferralLink(`${window.location.origin}/${localeStr}/auth/signup?ref=${referralCode}`);
    }
  }, [referralCode, localeStr]);
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Функция для копирования реферальной ссылки
  const copyReferralLink = () => {
    if (!referralLink) return;
    
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setIsCodeCopied(true);
        setTimeout(() => {
          if (isMounted.current) {
            setIsCodeCopied(false);
          }
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  // Функция для генерации реферального кода
  const handleGenerateCode = async () => {
    if (isGeneratingCode) return;
    
    setIsGeneratingCode(true);
    try {
      // Здесь должен быть вызов функции generateReferralCode
      console.log('Generate referral code');
      
      // Загружаем данные заново вместо перезагрузки страницы
      loadProfileData();
    } catch (err) {
      console.error('Failed to generate referral code:', err);
      setError((err as Error).message || 'An error occurred');
    } finally {
      setIsGeneratingCode(false);
    }
  };
  
  // Вычисление статистики ставок
  const calculateBetStats = (bets: BetWithEvent[]): BetStatistics => {
    const total = bets.length;
    const won = bets.filter(bet => bet.status === 'won').length;
    const lost = bets.filter(bet => bet.status === 'lost').length;
    const winRate = total > 0 ? (won / total) * 100 : 0;
    
    return {
      total,
      won,
      lost,
      winRate
    };
  };
  
  // Функция загрузки данных профиля
  const loadProfileData = useCallback(async () => {
    if (!user) {
      console.log("No user in loadProfileData, redirecting");
      router.push(`/${localeStr}/auth/signin?redirectTo=/${localeStr}/profile`);
      return;
    }
    
    // Устанавливаем флаг, что попытка загрузки была сделана
    dataLoadAttempted.current = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Starting to load profile data for user:", user.id);
      const supabase = createClientComponentClient<Database>();
      
      // Проверяем существование профиля перед загрузкой данных
      console.log("Checking if profile exists for user:", user.id);
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, referral_code')
        .eq('id', user.id)
        .single();
      
      console.log("Profile check result:", { profileData, profileError });
        
      // Если профиль не существует, создаем его через API
      if (profileError && profileError.code === 'PGRST116') {
        console.log('Profile not found, creating via API...');
        
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
          
          const responseData = await response.json();
          console.log("Profile creation response:", responseData);
          
          if (!response.ok) {
            console.error('Failed to create profile:', responseData);
            setError('Failed to create user profile');
            setIsLoading(false);
            return;
          }
          
          console.log('Profile created successfully');
          
          // Даем время БД на обновление
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Получаем созданный профиль для получения реферального кода
          const { data: newProfile, error: newProfileError } = await supabase
            .from('users')
            .select('referral_code')
            .eq('id', user.id)
            .single();
          
          console.log("New profile fetch result:", { newProfile, newProfileError });
            
          if (newProfile?.referral_code) {
            setReferralCode(newProfile.referral_code);
          }
        } catch (e) {
          console.error('Error creating profile:', e);
          setError('Error creating user profile');
          setIsLoading(false);
          return;
        }
      } else if (profileError) {
        console.error('Error checking user profile:', profileError);
        setError('Error checking user profile');
        setIsLoading(false);
        return;
      } else if (profileData) {
        console.log("Profile exists:", profileData);
        // Если профиль существует, получаем реферальный код
        if (profileData.referral_code) {
          setReferralCode(profileData.referral_code);
        }
      }
      
      // Загружаем данные параллельно
      console.log("Loading balance and bets data");
      try {
        const [balanceResponse, betsResponse] = await Promise.all([
          // Получаем баланс пользователя
          supabase
            .from('balances')
            .select('amount')
            .eq('user_id', user.id)
            .eq('currency', 'coins')
            .single(),
            
          // Получаем ставки пользователя
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
        
        console.log("Data loading results:", { 
          balanceResponse: { data: balanceResponse.data, error: balanceResponse.error },
          betsResponse: { count: betsResponse.data?.length, error: betsResponse.error }
        });
        
        if (balanceResponse.error && balanceResponse.error.code !== 'PGRST116') {
          console.error('Error loading balance:', balanceResponse.error);
        } else {
          setBalance(balanceResponse.data?.amount || 0);
        }
        
        if (betsResponse.error) {
          console.error('Error loading bets:', betsResponse.error);
        } else {
          const bets = betsResponse.data || [];
          setUserBets(bets);
          setBetStats(calculateBetStats(bets));
        }
      } catch (err) {
        console.error('Error loading balance or bets data:', err);
        // Не прерываем выполнение, чтобы хотя бы частично отобразить данные
      }
    } catch (err) {
      console.error('Error in loadProfileData:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных профиля');
    } finally {
      if (isMounted.current) {
        console.log("Profile data loading completed");
        setIsLoading(false);
      }
    }
  }, [user, router, localeStr]);
  
  // Загрузка данных только при первом рендере или изменении пользователя
  useEffect(() => {
    // Сбрасываем флаг при изменении пользователя
    if (user) {
      dataLoadAttempted.current = false;
    }
    
    // Защита от перезагрузки при потере фокуса вкладки
    if (!isAuthLoading && user && !dataLoadAttempted.current) {
      console.log("Loading profile data for user:", user.id);
      loadProfileData();
    } else if (!isAuthLoading && !user) {
      console.log("User not authenticated, redirecting to login");
      router.push(`/${localeStr}/auth/signin?redirectTo=/${localeStr}/profile`);
    } else if (isAuthLoading) {
      console.log("Auth is loading, waiting...");
    }
  }, [user, isAuthLoading, loadProfileData, router, localeStr]);
  
  // Добавляем обработчик ошибок для отладки
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Unhandled error:", event.error);
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
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
        <h1 className="text-2xl font-bold mb-8">{isAuthLoading ? t('profile.checkingAuth') : t('profile.loading')}</h1>
        
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
        <h1 className="text-2xl font-bold mb-8">{t('profile.error')}</h1>
        
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <Button onClick={() => {
          console.log("Retrying profile data loading");
          setError(null);
          setIsLoading(true);
          dataLoadAttempted.current = false; // Сбрасываем флаг, чтобы разрешить повторную загрузку
          loadProfileData();
        }}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }
  
  // Если пользователь не найден и не идет загрузка
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">{t('profile.notAuthenticated')}</h1>
        <p>{t('profile.pleaseSignIn')}</p>
        <Button className="mt-4" onClick={() => router.push(`/${localeStr}/auth/signin?redirectTo=/${localeStr}/profile`)}>
          {t('nav.signin')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('profile.title')}</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
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
          
          {/* Статистика ставок */}
          {betStats && (
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
          
          {/* Реферальная программа */}
          <Card className="mt-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 bg-[size:400%_400%] animate-gradient" />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 bg-[size:400%_400%] blur-xl animate-gradient" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('profile.referral.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm mb-4">
                {t('profile.referral.description')}
              </p>
              
              {referralCode ? (
                <div className="space-y-4">
                  <div className="relative">
                    <p className="text-sm text-muted-foreground mb-1">{t('profile.referral.yourLink')}</p>
                    <div className="flex">
                      <input
                        type="text"
                        readOnly
                        value={referralLink}
                        className="w-full p-2 border rounded-l-md bg-muted"
                      />
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-l-none"
                        onClick={copyReferralLink}
                      >
                        {isCodeCopied ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                >
                  {isGeneratingCode ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('profile.referral.generating')}
                    </>
                  ) : (
                    t('profile.referral.getLink')
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
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