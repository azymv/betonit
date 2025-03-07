'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, Check, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { useTranslation } from '@/lib/i18n-config';
import { useAuth } from '@/lib/context/auth-context';
import Link from 'next/link';
import { placeBet } from '@/lib/actions/bet-actions';
import { Event } from '@/lib/types/event';
import { User } from '@supabase/supabase-js';
import { RainbowButton } from "@/components/ui/rainbow-button";

// Define a type for the debug information
interface DebugInfo {
  auth?: {
    user: { id: string; email: string | undefined } | null;
    isAuthLoading: boolean;
  };
  fetchStarted?: boolean;
  noUser?: boolean;
  fetchingEvent?: boolean;
  eventResult?: {
    data: boolean | string | null;
    error: string | null;
  };
  fetchingBalance?: boolean;
  balanceResult?: {
    data: number | null;
    error: string | null;
    statusCode?: string | null;
  };
  fetchSuccess?: boolean;
  fetchError?: string;
  fetchCompleted?: boolean;
  triggeredFetch?: boolean;
  fullUserData?: User;
  requestParams?: { eventId: string; userId: string };
  eventRequestStarted?: string;
  eventRequestCompleted?: string;
  eventFetchException?: string;
  balanceRequestStarted?: string;
  balanceRequestCompleted?: string;
  balanceFetchException?: string;
  creatingBalance?: boolean;
  balanceCreationResult?: {
    data: number | null;
    error: string | null;
  };
}

export default function PlaceBetPage() {
  const params = useParams();
  const { locale, eventId } = params;
  const localeStr = typeof locale === 'string' ? locale : 'en';
  const eventIdStr = typeof eventId === 'string' ? eventId : '';
  const searchParams = useSearchParams();
  const prediction = searchParams.get('prediction') === 'yes';
  const { t } = useTranslation(localeStr);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Добавляем состояние для отладочной информации
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});

  const [event, setEvent] = useState<Event | null>(null);
  const [amount, setAmount] = useState<number>(10);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Минимальная и максимальная ставка
  const MIN_BET = 10;
  const MAX_BET = 1000;

  // Коэффициент для MVP (фиксированный 2.0)
  const ODDS = 2.0;

  // Ref для предотвращения многократного запуска fetchData
  const fetchAttempted = useRef(false);

  // ОТЛАДКА: Выводим текущее состояние аутентификации
  useEffect(() => {
    console.log('Auth state:', { user, isAuthLoading });
    
    // Сохраняем для отображения на странице
    setDebugInfo((prev: DebugInfo) => ({
      ...prev, 
      auth: { 
        user: user ? { id: user.id, email: user.email } : null,
        isAuthLoading
      }
    }));
  }, [user, isAuthLoading]);

  // Получение данных события и баланса пользователя
  useEffect(() => {
    const fetchData = async () => {
      if (fetchAttempted.current) return;
      fetchAttempted.current = true;
      
      setIsLoading(true);
      setDebugInfo(prev => ({ ...prev, fetchStarted: true }));
      
      try {
        if (!user) {
          // Обновляем отладочную информацию
          setDebugInfo(prev => ({ ...prev, noUser: true }));
          
          // Если пользователь не авторизован, перенаправляем на страницу входа
          console.log('User not authenticated, redirecting to sign in');
          router.push(`/${localeStr}/auth/signin?redirectTo=/${localeStr}/events/${eventIdStr}/bet?prediction=${prediction ? 'yes' : 'no'}`);
          return;
        }

        // Показываем данные пользователя для отладки
        console.log('Current user:', user);
        setDebugInfo(prev => ({ ...prev, fullUserData: user }));

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
        
        // Проверка параметров запроса
        console.log('Event ID being used:', eventIdStr);
        setDebugInfo(prev => ({ ...prev, requestParams: { eventId: eventIdStr, userId: user.id } }));
        
        // Получаем событие
        try {
          setDebugInfo(prev => ({ ...prev, fetchingEvent: true, eventRequestStarted: new Date().toISOString() }));
          
          console.log('Requesting event data...');
          const eventPromise = supabase
            .from('events')
            .select('*')
            .eq('id', eventIdStr)
            .single();
          
          console.log('Event request sent');
          const { data: eventData, error: eventError } = await eventPromise;
          console.log('Event response received');
          
          // Обновляем отладочную информацию
          setDebugInfo(prev => ({ 
            ...prev, 
            eventRequestCompleted: new Date().toISOString(),
            eventResult: { 
              data: eventData ? JSON.stringify(eventData) : null, 
              error: eventError ? eventError.message : null 
            }
          }));
          
          if (eventError) {
            console.error('Error fetching event:', eventError);
            throw new Error(`Ошибка при загрузке события: ${eventError.message}`);
          }
          
          if (!eventData) {
            throw new Error(t('errors.eventNotFound'));
          }
          
          // Проверяем, активно ли событие
          if (eventData.status !== 'active') {
            throw new Error(t('errors.eventNotActive'));
          }
          
          setEvent(eventData as Event);
          console.log('Event data set successfully');
        } catch (eventErr) {
          console.error('Exception in event fetch:', eventErr);
          setDebugInfo(prev => ({ ...prev, eventFetchException: String(eventErr) }));
          throw eventErr;
        }
        
        // Получаем баланс пользователя
        try {
          setDebugInfo(prev => ({ ...prev, fetchingBalance: true, balanceRequestStarted: new Date().toISOString() }));
          
          console.log('Requesting balance data...');
          console.log('User ID for balance query:', user.id);
          
          const balancePromise = supabase
            .from('balances')
            .select('amount')
            .eq('user_id', user.id)
            .eq('currency', 'coins')
            .single();
            
          console.log('Balance request sent');
          const { data: balanceData, error: balanceError } = await balancePromise;
          console.log('Balance response received:', balanceData, balanceError);
          
          // Обновляем отладочную информацию
          setDebugInfo(prev => ({ 
            ...prev, 
            balanceRequestCompleted: new Date().toISOString(),
            balanceResult: { 
              data: balanceData ? balanceData.amount : null, 
              error: balanceError ? balanceError.message : null,
              statusCode: balanceError ? balanceError.code : null
            }
          }));
          
          if (balanceError) {
            if (balanceError.code === 'PGRST116') {
              // Запись не найдена, пробуем создать баланс
              console.log('Balance not found, creating new balance record');
              setDebugInfo(prev => ({ ...prev, creatingBalance: true }));
              
              const { data: newBalance, error: createError } = await supabase
                .from('balances')
                .insert({
                  user_id: user.id,
                  amount: 1000,
                  currency: 'coins'
                })
                .select('amount')
                .single();
                
              setDebugInfo(prev => ({ 
                ...prev, 
                balanceCreationResult: { 
                  data: newBalance ? newBalance.amount : null, 
                  error: createError ? createError.message : null 
                }
              }));
              
              if (createError) {
                console.error('Error creating balance:', createError);
                throw new Error(`Ошибка при создании баланса: ${createError.message}`);
              }
              
              setBalance(newBalance?.amount || 1000);
            } else {
              console.error('Error fetching balance:', balanceError);
              throw new Error(`Ошибка при загрузке баланса: ${balanceError.message}`);
            }
          } else {
            setBalance(balanceData?.amount || 0);
          }
          
          console.log('Balance data set successfully:', balanceData?.amount);
        } catch (balanceErr) {
          console.error('Exception in balance fetch:', balanceErr);
          setDebugInfo(prev => ({ ...prev, balanceFetchException: String(balanceErr) }));
          throw balanceErr;
        }
        
        // Все данные успешно загружены
        setDebugInfo(prev => ({ ...prev, fetchSuccess: true }));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : t('errors.dataLoadError'));
        
        // Обновляем отладочную информацию
        setDebugInfo(prev => ({ 
          ...prev, 
          fetchError: err instanceof Error ? err.message : String(err)
        }));
      } finally {
        setIsLoading(false);
        setDebugInfo(prev => ({ ...prev, fetchCompleted: true }));
      }
    };
    
    if (user !== null) {
      fetchData();
    }
  }, [user, eventIdStr, localeStr, router, prediction, t]);

  // Обработка изменения суммы ставки
  const handleAmountChange = (value: string) => {
    const newAmount = Math.min(Math.max(Number(value) || 0, MIN_BET), MAX_BET);
    setAmount(newAmount);
  };

  // Обработка изменения слайдера
  const handleSliderChange = (value: number[]) => {
    setAmount(value[0]);
  };

  // Расчет потенциального выигрыша
  const calculatePotentialWinnings = () => {
    return amount * ODDS;
  };

  // Размещение ставки
  const handlePlaceBet = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Проверяем, авторизован ли пользователь
      if (!user) {
        router.push(`/${localeStr}/auth/signin?redirectTo=/${localeStr}/events/${eventIdStr}/bet?prediction=${prediction ? 'yes' : 'no'}`);
        return;
      }
      
      // Проверяем, достаточно ли средств у пользователя
      if (amount > balance) {
        setError(t('errors.insufficientBalance'));
        return;
      }
      
      // Размещаем ставку через серверное действие
      const result = await placeBet({
        eventId: eventIdStr,
        userId: user.id,
        amount,
        prediction,
      });
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Показываем сообщение об успехе
      setSuccessMessage(t('events.betPlacedSuccess'));
      
      // Обновляем баланс пользователя
      setBalance(prevBalance => prevBalance - amount);
      
      // Через 2 секунды перенаправляем на страницу события
      setTimeout(() => {
        router.push(`/${localeStr}/events/${eventIdStr}`);
      }, 2000);
    } catch (err) {
      console.error('Error placing bet:', err);
      setError(err instanceof Error ? err.message : t('errors.betError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Форматирование числа с разделителями
  const formatNumber = (num: number) => {
    return num.toLocaleString(localeStr === 'en' ? 'en-US' : 'ru-RU');
  };

  // ОТЛАДКА: Если возникает ошибка или загрузка слишком долгая, показываем отладочную панель
  if ((isLoading && Object.keys(debugInfo).length > 0) || error) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Отладочная информация</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="bg-slate-100 p-4 rounded mb-4 overflow-auto">
              <pre className="text-xs">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
            
            <p className="text-sm text-gray-500 mb-2">Состояние:</p>
            <ul className="text-sm space-y-1 mb-4">
              <li>isLoading: {isLoading ? 'true' : 'false'}</li>
              <li>isAuthLoading: {isAuthLoading ? 'true' : 'false'}</li>
              <li>User: {user ? user.email : 'не авторизован'}</li>
              <li>Event: {event ? 'загружено' : 'не загружено'}</li>
              <li>Balance: {balance}</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/${localeStr}/events/${eventIdStr}`}>
                Вернуться к событию
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Отображение загрузки
  if (isLoading || isAuthLoading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-8">
        <Skeleton className="h-10 w-20 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('common.back')}
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('events.placeBet')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {successMessage ? (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">{t('events.betSuccess')}</AlertTitle>
              <AlertDescription className="text-green-700">
                {successMessage}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div>
                <h3 className="font-medium mb-2">{event?.title}</h3>
                <p className="text-sm text-muted-foreground">{event?.short_description}</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{t('events.yourPrediction')}:</span>
                  <Badge variant={prediction ? "default" : "secondary"}>
                    {prediction ? t('common.yes') : t('common.no')}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('events.currentBalance')}:</span>
                  <span className="font-medium">{formatNumber(balance)} {t('common.coins')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('events.odds')}:</span>
                  <span className="font-medium">x{ODDS.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">{t('events.betAmount')}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      min={MIN_BET}
                      max={MAX_BET}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">{t('common.coins')}</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{MIN_BET}</span>
                    <span>{MAX_BET}</span>
                  </div>
                  <Slider
                    value={[amount]}
                    min={MIN_BET}
                    max={MAX_BET}
                    step={10}
                    onValueChange={handleSliderChange}
                  />
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t('events.betAmount')}:</span>
                    <span>{formatNumber(amount)} {t('common.coins')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>{t('events.potentialWinnings')}:</span>
                    <span>{formatNumber(calculatePotentialWinnings())} {t('common.coins')}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          {successMessage ? (
            <Button asChild className="w-full">
              <Link href={`/${localeStr}/events/${eventIdStr}`}>
                {t('events.backToEvent')}
              </Link>
            </Button>
          ) : (
            <RainbowButton 
              className="w-full" 
              onClick={handlePlaceBet}
              disabled={isSubmitting || amount < MIN_BET || amount > MAX_BET || amount > balance}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                locale === 'en' ? 'Make a prediction' : 'Сделать предсказание'
              )}
            </RainbowButton>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}