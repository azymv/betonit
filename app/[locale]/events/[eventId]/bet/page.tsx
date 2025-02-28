'use client';

import { useState, useEffect } from 'react';
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

  // Получение данных события и баланса пользователя
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!user) {
          // Если пользователь не авторизован, перенаправляем на страницу входа
          router.push(`/${localeStr}/auth/signin?redirectTo=/${localeStr}/events/${eventIdStr}/bet?prediction=${prediction ? 'yes' : 'no'}`);
          return;
        }

        const supabase = createClientComponentClient<Database>();
        
        // Получаем событие
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventIdStr)
          .single();
        
        if (eventError) {
          throw eventError;
        }
        
        if (!eventData) {
          throw new Error(t('errors.eventNotFound'));
        }
        
        // Проверяем, активно ли событие
        if (eventData.status !== 'active') {
          throw new Error(t('errors.eventNotActive'));
        }
        
        setEvent(eventData as Event);
        
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
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : t('errors.dataLoadError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [eventIdStr, user, localeStr, router, prediction, t]);

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

  // Отображение ошибки
  if (error && !successMessage) {
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
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('errors.title')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/${localeStr}/events/${eventIdStr}`}>
                {t('events.backToEvent')}
              </Link>
            </Button>
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
            <Button 
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
                t('events.placeBetButton')
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}