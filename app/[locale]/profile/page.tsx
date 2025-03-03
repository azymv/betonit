'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { useAuth } from '@/lib/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { Loader2, User, Wallet, ListTodo, Users, Copy, CheckCircle2, BarChart3 } from 'lucide-react';
import { generateReferralCode, getReferralStats } from '../../../lib/actions/referral-actions';

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

// Определение интерфейса для статистики рефералов
interface ReferralStats {
  totalReferrals: number;
  totalEarned: number;
}

export default function ProfilePage() {
  const params = useParams();
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  const { t } = useTranslation(localeStr);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [userBets, setUserBets] = useState<BetWithEvent[]>([]);
  const [betStats, setBetStats] = useState<BetStatistics | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [referralLink, setReferralLink] = useState<string>('');
  
  // Обновляем реферальную ссылку при изменении кода
  useEffect(() => {
    if (referralCode && typeof window !== 'undefined') {
      setReferralLink(`${window.location.origin}/${localeStr}/auth/signup?ref=${referralCode}`);
    }
  }, [referralCode, localeStr]);
  
  // Функция для копирования реферальной ссылки
  const copyReferralLink = () => {
    if (!referralLink) return;
    
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setIsCodeCopied(true);
        setTimeout(() => setIsCodeCopied(false), 2000);
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
      const result = await generateReferralCode();
      console.log('Generate referral code result:', result);
      
      if (result.success && result.code) {
        setReferralCode(result.code);
        // Wait a bit to ensure the code is saved
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Reload the page to get fresh data
        window.location.reload();
      } else {
        console.error('Failed to generate referral code:', result.message);
        throw new Error(result.message || 'Failed to generate referral code');
      }
    } catch (err) {
      console.error('Failed to generate referral code:', err);
      // You might want to show an error message to the user here
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
  
  useEffect(() => {
    const loadProfileData = async () => {
      // Проверяем, есть ли пользователь и не выполняется ли уже загрузка
      if (!user || isLoading) {
        return;
      }
      
      // Предотвращаем множественные загрузки
      setIsLoading(true);
      
      try {
        const supabase = createClientComponentClient<Database>();
        
        // Загружаем все данные параллельно для ускорения
        const [
          profileResponse, 
          balanceResponse, 
          betsResponse, 
          referralCodeResponse
        ] = await Promise.all([
          // Проверяем существование профиля
          supabase.from('users').select('*').eq('id', user.id).single(),
          
          // Загружаем баланс
          supabase.from('balances').select('amount').eq('user_id', user.id).eq('currency', 'coins').single(),
          
          // Загружаем ставки
          supabase.from('bets')
            .select(`*, events:event_id (title, status, result)`)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
            
          // Загружаем реферальный код
          supabase.from('users').select('referral_code').eq('id', user.id).single()
        ]);
        
        // Проверяем, существует ли профиль
        if (profileResponse.error && profileResponse.error.code === 'PGRST116') {
          // Профиль не существует - создаем его через API
          // Важно: используем fetch вместо перезагрузки страницы
          console.log('User profile not found, creating...');
          
          // Сохраняем информацию, что мы уже пытаемся создать профиль,
          // чтобы избежать множественных запросов
          sessionStorage.setItem('creatingProfile', 'true');
          
          const result = await fetch('/api/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              username: user.user_metadata?.username,
              full_name: user.user_metadata?.full_name,
              language: user.user_metadata?.language,
            }),
          });
          
          if (!result.ok) {
            const errorData = await result.json();
            console.error('Failed to create user profile:', errorData);
            // Не перезагружаем страницу, просто показываем ошибку
          } else {
            // Подождем немного и попробуем загрузить данные снова
            setTimeout(() => {
              // Но не перезагружаем страницу
              setIsLoading(false);
              // Убираем флаг
              sessionStorage.removeItem('creatingProfile');
            }, 1000);
          }
          return;
        }
        
        // Обрабатываем данные, если они получены успешно
        
        // Баланс
        if (!balanceResponse.error || balanceResponse.error.code === 'PGRST116') {
          setBalance(balanceResponse.data?.amount || 0);
        }
        
        // Ставки
        if (!betsResponse.error) {
          const bets = betsResponse.data || [];
          setUserBets(bets);
          setBetStats(calculateBetStats(bets));
        }
        
        // Реферальный код
        if (!referralCodeResponse.error) {
          setReferralCode(referralCodeResponse.data?.referral_code || '');
        }
        
        // Статистика рефералов
        try {
          const referralStatsResult = await getReferralStats();
          if (referralStatsResult.success && referralStatsResult.stats) {
            setReferralStats(referralStatsResult.stats);
          }
        } catch (err) {
          console.error('Error loading referral stats:', err);
          // Не блокируем загрузку остальной части страницы
        }
        
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        // Завершаем загрузку
        setIsLoading(false);
      }
    };
    
    // Добавим проверку на множественные вызовы
    if (user && !sessionStorage.getItem('creatingProfile')) {
      loadProfileData();
    } else if (!user) {
      // Перенаправление на страницу входа
      router.push(`/${localeStr}/auth/signin?redirectTo=profile`);
    }
    
    // Добавляем очистку и обработку видимости страницы
    return () => {
      // Очищаем состояние при размонтировании, если необходимо
    };
  }, [user, router, localeStr]); // Убираем зависимости, которые могут вызывать повторные рендеры
  
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
                  
                  {referralStats && (
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-xl font-bold">{referralStats.totalReferrals}</p>
                          <p className="text-sm text-muted-foreground">{t('profile.referral.invited')}</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold">{formatNumber(referralStats.totalEarned)}</p>
                          <p className="text-sm text-muted-foreground">{t('profile.referral.earned')}</p>
                        </div>
                      </div>
                    </div>
                  )}
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