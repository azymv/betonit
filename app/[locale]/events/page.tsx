'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { useTranslation } from '@/lib/i18n-config';
import { EVENT_CATEGORIES, Event } from '@/lib/types/event';
import Image from 'next/image';

export default function EventsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
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
        
        // Строим запрос
        let query = supabase.from('events').select('*');
        
        // Добавляем фильтр категории, если выбрана
        if (selectedCategory && selectedCategory !== 'all') {
          query = query.eq('category', selectedCategory);
        }
        
        // Сортируем по дате окончания (ближайшие первыми)
        query = query.order('end_time', { ascending: true });
        
        // Выполняем запрос
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        setEvents(data || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке событий');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [selectedCategory]);

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", {
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

  // Получаем статистику ставок (фиксированные значения)
  const getEventStats = (event: Event) => {
    // Используем ID события для получения стабильного значения
    const hash = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const yesProbability = (hash % 71) + 15; // Значение от 15 до 85
    
    return {
      yesProbability,
      noProbability: 100 - yesProbability
    };
  };

  // Отображение загрузки
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-48 mb-8" />
        <div className="mb-8">
          <Skeleton className="h-6 w-32 mb-2" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg relative overflow-hidden" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Отображение ошибки
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('events.allEvents')}</h1>
        <div className="p-4 mb-8 bg-red-50 text-red-800 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold mb-2">{t('errors.failedToLoadEvents')}</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('events.allEvents')}</h1>
      
      {/* Фильтры */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">{t('events.categoriesFilter')}</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={selectedCategory === null ? "default" : "outline"} 
            className="rounded-full"
            onClick={() => setSelectedCategory(null)}
          >
            {t('events.allCategories')}
          </Button>
          {EVENT_CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryText(category)}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Список событий */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">{t('events.noEventsFound')}</h3>
          <p className="text-muted-foreground">{t('events.tryDifferentFilters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event) => {
            const stats = getEventStats(event);
            
            return (
              <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-40 w-full bg-slate-200">
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
                  <Badge 
                    className="absolute top-2 right-2"
                    variant="default"
                  >
                    {getCategoryText(event.category)}
                  </Badge>
                  <Badge 
                    className="absolute top-2 left-2"
                    variant={event.status === 'active' ? 'secondary' : 'outline'}
                  >
                    {getStatusText(event.status)}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {event.short_description}
                  </p>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('events.yesPercent')}: {stats.yesProbability}%</span>
                    <span>{t('events.ends')}: {formatDate(event.end_time)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${stats.yesProbability}%` }}
                    />
                  </div>
                  <div className="mt-4">
                    <Button className="w-full" asChild>
                      <Link href={`/${locale}/events/${event.id}`}>
                        {t('events.viewDetails')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}