'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [error, setError] = useState<string | null>(null);
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
        // Загружаем данные заново вместо перезагрузки страницы
        loadProfileData();
      } else {
        console.error('Failed to generate referral code:', result.message);
        setError(result.message || 'Failed to generate referral code');
      }
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
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Loading profile data for user:", user.id);
      const supabase = createClientComponentClient<Database>();
      
      // Загружаем данные параллельно для ускорения
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
      
      // Проверяем ошибки и обрабатываем результаты
      if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
        console.error("Error checking profile:", profileResponse.error);
      }
      
      // Обрабатываем результаты
      if (!balanceResponse.error || balanceResponse.error.code === 'PGRST116') {
        setBalance(balanceResponse.data?.amount || 0);
      } else {
        console.error("Error loading balance:", balanceResponse.error);
      }
      
      if (!betsResponse.error) {
        const bets = betsResponse.data || [];
        setUserBets(bets);
        setBetStats(calculateBetStats(bets));
      } else {
        console.error("Error loading bets:", betsResponse.error);
      }
      
      if (!referralCodeResponse.error) {
        setReferralCode(referralCodeResponse.data?.referral_code || null);
      } else {
        console.error("Error loading referral code:", referralCodeResponse.error);
      }
      
      // Загрузка статистики рефералов
      try {
        const referralStatsResult = await getReferralStats();
        if (referralStatsResult.success && referralStatsResult.stats) {
          setReferralStats(referralStatsResult.stats);
        } else if (!referralStatsResult.success) {
          console.error("Error getting referral stats:", referralStatsResult.message);
        }
      } catch (err) {
        console.error('Error loading referral stats:', err);
      }
      
    } catch (error) {
      console.error('Error loading profile data:', error);
      setError((error as Error).message || 'Error loading profile data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Загрузка данных при монтировании и изменении пользователя
  useEffect(() => {
    if (!isAuthLoading && user) {
      loadProfileData();
    } else if (!isAuthLoading && !user) {
      router.push(`/${localeStr}/auth/signin?redirectTo=/${localeStr}/profile`);
    }
  }, [user, isAuthLoading, loadProfileData, router, localeStr]);
  
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
  
  if (!user) {
    return null;
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