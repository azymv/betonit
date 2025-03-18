'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { useTranslation } from '@/lib/i18n-config';
import { useAuth } from '@/lib/context/auth-context';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { Event } from '@/lib/types/event';
import { Bet } from '@/lib/types/event';
import Image from 'next/image';

export default function EventPage() {
  const params = useParams();
  const { locale, eventId } = params;
  const localeStr = typeof locale === 'string' ? locale : 'en';
  const eventIdStr = typeof eventId === 'string' ? eventId : '';
  const { t } = useTranslation(localeStr);
  const router = useRouter();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [userBet, setUserBet] = useState<Bet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Получение данных события
  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      try {
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
          throw new Error('Событие не найдено');
        }
        
        setEvent(eventData as Event);
        
        // Если пользователь авторизован, проверяем, делал ли он ставки на это событие
        if (user) {
          const { data: betData } = await supabase
            .from('bets')
            .select('*')
            .eq('event_id', eventIdStr)
            .eq('user_id', user.id)
            .maybeSingle();
          
          setUserBet(betData as Bet | null);
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке события');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (eventIdStr) {
      fetchEvent();
    }
  }, [eventIdStr, user]);

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(localeStr === "en" ? "en-US" : "ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Получаем статус на нужном языке
  const getStatusText = (status: string) => {
    return t(`events.status.${status}`);
  };

  // Получаем название категории на нужном языке
  const getCategoryText = (category: string) => {
    return t(`events.categories.${category}`);
  };

// Получаем статистику ставок (фиксированные значения для MVP)
const getEventStats = () => {
  // Используем детерминированное значение на основе ID события
  // Это сделает проценты стабильными, пока ID не изменится
  const hash = eventIdStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const yesProbability = (hash % 71) + 15; // Значение от 15 до 85
  
  return {
    yesProbability,
    noProbability: 100 - yesProbability,
    yesAmount: yesProbability * 100,
    noAmount: (100 - yesProbability) * 100
  };
};

  // Отображение загрузки
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-56 w-full rounded-lg mb-6 relative overflow-hidden" />
            <Skeleton className="h-6 w-full mb-3" />
            <Skeleton className="h-6 w-full mb-3" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Отображение ошибки
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('errors.eventNotFound')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button asChild>
          <Link href={`/${localeStr}/events`}>
            {t('events.allEvents')}
          </Link>
        </Button>
      </div>
    );
  }

    // Загружаем статистику для отображения
    const stats = getEventStats();

  if (!event) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('common.back')}
      </Button>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <div className="mb-2">
            <Badge>
              {getCategoryText(event.category)}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
          
          <div className="relative bg-slate-200 h-56 w-full rounded-lg mb-6 overflow-hidden">
            {event.image_url ? (
              <Image 
                src={event.image_url.startsWith('http') 
                  ? event.image_url 
                  : event.image_url.startsWith('/') 
                    ? event.image_url 
                    : `/${event.image_url}`}
                alt={event.title}
                fill
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  // If the image fails to load, replace with the placeholder
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/events/event_placeholder.png';
                }}
              />
            ) : (
              <Image 
                src="/images/events/event_placeholder.png" 
                alt="Placeholder image"
                fill
                style={{ objectFit: 'cover' }}
              />
            )}
          </div>
          
          <div className="prose max-w-none mb-8">
            <p>{event.description}</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('events.details')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border p-4 rounded-lg">
                <div className="flex items-center text-muted-foreground mb-1">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <p className="text-sm">{t('events.startDate')}</p>
                </div>
                <p className="font-medium">{formatDate(event.start_time)}</p>
              </div>
              <div className="border p-4 rounded-lg">
                <div className="flex items-center text-muted-foreground mb-1">
                  <Clock className="h-4 w-4 mr-2" />
                  <p className="text-sm">{t('events.endDate')}</p>
                </div>
                <p className="font-medium">{formatDate(event.end_time)}</p>
              </div>
              <div className="border p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{t('events.status.label')}</p>
                <div className="flex items-center">
                  <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                    {getStatusText(event.status)}
                  </Badge>
                </div>
              </div>
              <div className="border p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{t('events.totalBets')}</p>
                <p className="font-medium">{stats.yesAmount + stats.noAmount} {t('common.coins')}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-1/3">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t('events.placeBet')}</h2>
              
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('common.yes')}: {stats.yesProbability}%</span>
                  <span>{t('common.no')}: {stats.noProbability}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${stats.yesProbability}%` }}
                  />
                </div>
              </div>
              
              {userBet ? (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <AlertTitle>{t('events.alreadyBet')}</AlertTitle>
                    <AlertDescription>
                      {t('events.yourBet')}: {userBet.prediction ? t('common.yes') : t('common.no')}
                      <br />
                      {t('events.amount')}: {userBet.amount} {t('common.coins')}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button className="w-full h-16 text-lg" asChild>
                    <Link href={`/${localeStr}/events/${eventIdStr}/bet?prediction=yes`}>
                      {t('common.yes')} ({stats.yesProbability}%)
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full h-16 text-lg" asChild>
                    <Link href={`/${localeStr}/events/${eventIdStr}/bet?prediction=no`}>
                      {t('common.no')} ({stats.noProbability}%)
                    </Link>
                  </Button>
                </div>
              )}
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>{t('events.odds')}: x2.0</p>
                <p>{t('events.minBet')}: 10 {t('common.coins')}</p>
                <p>{t('events.maxBet')}: 1000 {t('common.coins')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}