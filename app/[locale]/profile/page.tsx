'use client';

import { useState, useEffect, useRef } from 'react';
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
import { User, Wallet, ListTodo, Loader2, Copy, CheckCircle2, Users, BarChart3, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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
  const [referralCode, setReferralCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [referralLink, setReferralLink] = useState<string>('');
  // Локальное состояние для отслеживания таймаута аутентификации
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [dataLoadAttempted, setDataLoadAttempted] = useState(false);
  
  // Refs для отслеживания состояния компонента
  const isMounted = useRef(true);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
        setIsCopied(true);
        setTimeout(() => {
          if (isMounted.current) {
            setIsCopied(false);
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
      setError((err as Error).message ? { message: (err as Error).message } : null);
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
  
  // Загрузка данных профиля
  const loadProfileData = async () => {
    setDataLoadAttempted(true);
    setIsLoading(true);
    setError(null);
    
    try {
      // Проверяем, что пользователь авторизован
      if (!user) {
        console.log("No user found, redirecting to sign in");
        setIsLoading(false);
        router.push(`/${localeStr}/auth/signin`);
        return;
      }
      
      // Проверяем, что у пользователя есть ID
      if (!user.id) {
        console.error("User has no ID");
        setError({
          message: "User has no ID",
          details: "Cannot load profile without user ID"
        });
        setIsLoading(false);
        return;
      }
      
      console.log("Loading profile data for user:", user.id);
      
      // Загружаем данные пользователя и баланс параллельно
      const [userResult, balanceResult, betsResult] = await Promise.allSettled([
        // Загрузка данных пользователя
        supabase
          .from('users')
          .select('id, referral_code')
          .eq('id', user.id)
          .single(),
          
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
            id, amount, potential_win, created_at, status, user_id, event_id,
            events (title, status, result)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);
      
      // Обрабатываем результат загрузки данных пользователя
      if (userResult.status === 'fulfilled') {
        const { data: userData, error: userError } = userResult.value;
        
        if (userError) {
          console.error("Error loading user data:", userError);
          
          // Если пользователь не найден, пытаемся создать профиль
          if (userError.code === 'PGRST116') {
            console.log("User profile not found, creating profile");
            
            const { createProfileIfNeeded } = await import('@/lib/actions/auth-actions');
            const result = await createProfileIfNeeded(user.id, {
              email: user.email || '',
              username: user.user_metadata?.username,
              full_name: user.user_metadata?.full_name,
              language: localeStr || 'en',
              referred_by: user.user_metadata?.referred_by,
            });
            
            if (result.success) {
              console.log("Profile created successfully, reloading data");
              // Повторно загружаем данные после создания профиля
              loadProfileData();
              return;
            } else {
              console.error("Failed to create profile:", result.error);
              setError({
                message: "Failed to create profile",
                details: result.error && typeof result.error === 'object' && 'message' in result.error 
                  ? String(result.error.message) 
                  : "Unknown error"
              });
            }
          } else {
            setError({
              message: "Error loading user data",
              details: userError.message
            });
          }
        } else if (userData) {
          setReferralCode(userData.referral_code || '');
        }
      } else {
        console.error("Failed to load user data:", userResult.reason);
      }
      
      // Обрабатываем результат загрузки баланса
      if (balanceResult.status === 'fulfilled') {
        const { data: balanceData, error: balanceError } = balanceResult.value;
        
        if (balanceError) {
          console.error("Error loading balance:", balanceError);
          // Не прерываем выполнение, чтобы показать хотя бы часть данных
        } else if (balanceData) {
          setBalance(balanceData.amount || 0);
        }
      } else {
        console.error("Failed to load balance:", balanceResult.reason);
        if (balanceResult.reason instanceof Error) {
          setError({
            message: "Failed to load balance",
            details: balanceResult.reason.message
          });
        }
      }
      
      // Обрабатываем результат загрузки ставок
      if (betsResult.status === 'fulfilled') {
        const { data: betsData, error: betsError } = betsResult.value;
        
        if (betsError) {
          console.error("Error loading bets:", betsError);
        } else if (betsData) {
          // Приводим данные к нужному типу
          const typedBets = betsData as unknown as BetWithEvent[];
          setUserBets(typedBets);
          setBetStats(calculateBetStats(typedBets));
        }
      } else {
        console.error("Failed to load bets:", betsResult.reason);
      }
    } catch (err) {
      console.error("Error loading profile data:", err);
      setError({
        message: "Error loading profile data",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Добавляем таймаут для состояния загрузки аутентификации
  useEffect(() => {
    // Устанавливаем таймаут только если идет загрузка аутентификации
    if (isAuthLoading && !authTimedOut) {
      // Очищаем предыдущий таймаут, если он был
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
      
      // Устанавливаем новый таймаут
      authTimeoutRef.current = setTimeout(() => {
        console.log("Authentication loading timed out after 5 seconds");
        setAuthTimedOut(true);
        
        // Если пользователь есть, пытаемся загрузить данные
        if (user) {
          loadProfileData();
        } else {
          // Если пользователя нет, перенаправляем на страницу входа
          router.push(`/${localeStr}/auth/signin`);
        }
      }, 5000);
    }
    
    // Очищаем таймаут при размонтировании компонента
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [isAuthLoading, authTimedOut, user, router, localeStr]);
  
  // Загрузка данных только при первом рендере или изменении пользователя
  useEffect(() => {
    // Сбрасываем флаг при изменении пользователя
    if (user) {
      setDataLoadAttempted(false);
    }
    
    // Защита от перезагрузки при потере фокуса вкладки
    if ((!isAuthLoading || authTimedOut) && user && !dataLoadAttempted) {
      console.log("Loading profile data for user:", user.id);
      loadProfileData();
    } else if ((!isAuthLoading || authTimedOut) && !user) {
      console.log("No user found, redirecting to sign in");
      router.push(`/${localeStr}/auth/signin`);
    }
    
    // Очистка при размонтировании
    return () => {
      isMounted.current = false;
    };
  }, [user, isAuthLoading, authTimedOut, router, localeStr, dataLoadAttempted]);
  
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
  
  // Рендеринг компонента
  return (
    <div className="container py-8">
      {/* Показываем состояние загрузки */}
      {(isLoading || isAuthLoading) && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-lg font-medium mb-2">
            {isAuthLoading ? t('profile.checkingAuth') : t('profile.loading')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('profile.pleaseWait')}
          </p>
        </div>
      )}
      
      {/* Показываем ошибку */}
      {error && !isLoading && !isAuthLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertTitle>{t('profile.errorTitle')}</AlertTitle>
              <AlertDescription>
                {error.message}: {error.details}
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => {
                setError(null);
                loadProfileData();
              }}
              className="w-full"
            >
              {t('profile.retry')}
            </Button>
          </div>
        </div>
      )}
      
      {/* Показываем сообщение, если пользователь не авторизован */}
      {!user && !isLoading && !isAuthLoading && dataLoadAttempted && (
        <div className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">{t('profile.notSignedIn')}</h2>
          <p className="text-muted-foreground mb-6">{t('profile.signInToView')}</p>
          <Button asChild>
            <Link href={`/${localeStr}/auth/signin`}>
              {t('profile.signIn')}
            </Link>
          </Button>
        </div>
      )}
      
      {/* Показываем данные профиля */}
      {user && !isLoading && !isAuthLoading && !error && (
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
                          {isCopied ? (
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
      )}
    </div>
  );
}