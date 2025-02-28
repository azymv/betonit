'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Database, Check } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database as SupabaseDatabase } from '@/lib/types/supabase';
import { Event, EventStatus } from '@/lib/types/event';

// Define a type for the result state
interface AdminResult {
  success: boolean;
  message: string;
  eventsCount?: number;
  existingCount?: number;
  events?: Event[];
}

export default function AdminPage() {
  const params = useParams();
  // localeStr is kept for future localization support
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdminResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Функция для создания тестовых событий
  const createTestEvents = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const supabase = createClientComponentClient<SupabaseDatabase>();
      
      // Примеры событий для заполнения базы данных
      const sampleEvents = [
        {
          title: 'Будет ли Bitcoin выше $100k к концу года?',
          description: 'Криптовалюта Bitcoin продолжает оставаться одним из самых волатильных активов на рынке. Последние годы показали значительные колебания курса, и многие аналитики предсказывают новый рекордный пик в этом году. Вопрос в том, преодолеет ли курс психологическую отметку в $100,000 до 31 декабря 2025 года по данным CoinMarketCap.',
          short_description: 'Сделайте ставку на будущую стоимость Bitcoin',
          image_url: '/images/events/placeholder.jpg',
          category: 'cryptocurrency',
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
          status: 'active' as EventStatus,
        },
        {
          title: 'Кто победит на выборах?',
          description: 'Предстоящие выборы обещают быть одними из самых напряженных в истории. Основная борьба развернется между двумя кандидатами. Исход выборов может значительно повлиять на экономическую и социальную политику страны в следующие годы.',
          short_description: 'Предсказывайте политические события',
          image_url: '/images/events/placeholder.jpg',
          category: 'politics',
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().setDate(new Date().getDate() + 60)).toISOString(),
          status: 'active' as EventStatus,
        },
        {
          title: 'Будет ли запущена колонизация Марса в этом году?',
          description: 'Космические агентства и частные компании активно разрабатывают планы освоения Марса. Будет ли сделан первый шаг к созданию постоянного поселения на Красной планете в этом году? Событие будет считаться произошедшим, если официально будет объявлено о начале создания постоянной колонии.',
          short_description: 'Космические события и запуски',
          image_url: '/images/events/placeholder.jpg',
          category: 'science',
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().setDate(new Date().getDate() + 90)).toISOString(),
          status: 'active' as EventStatus,
        },
        {
          title: 'Выйдет ли новая версия iOS до конца квартала?',
          description: 'Apple обычно следует определенному графику выпуска своих основных обновлений ОС. Будет ли следующая версия iOS выпущена до конца текущего квартала или компания сместит традиционный график?',
          short_description: 'Технологические события и релизы',
          image_url: '/images/events/placeholder.jpg',
          category: 'technology',
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString(),
          status: 'active' as EventStatus,
        },
        {
          title: 'Превысит ли цена на нефть $100 за баррель?',
          description: 'Цены на нефть подвержены влиянию множества факторов, от геополитики до экономических показателей. Преодолеет ли стоимость барреля нефти марки Brent отметку в $100 до конца текущего года?',
          short_description: 'Экономические предсказания',
          image_url: '/images/events/placeholder.jpg',
          category: 'economy',
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().setDate(new Date().getDate() + 75)).toISOString(),
          status: 'active' as EventStatus,
        },
        {
          title: 'Будет ли лето 2025 самым жарким за всю историю?',
          description: 'Климатические изменения приводят к экстремальным погодным явлениям. Будет ли лето 2025 года самым жарким по среднеглобальной температуре за всю историю метеонаблюдений по данным NASA и NOAA?',
          short_description: 'Климатические прогнозы',
          image_url: '/images/events/placeholder.jpg',
          category: 'science',
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().setDate(new Date().getDate() + 120)).toISOString(),
          status: 'upcoming' as EventStatus,
        }
      ];
      
      // Проверяем наличие существующих событий
      const { data: existingEvents, error: checkError } = await supabase
        .from('events')
        .select('id')
        .limit(1);
        
      if (checkError) {
        throw new Error(`Ошибка при проверке существующих событий: ${checkError.message}`);
      }
      
      if (existingEvents && existingEvents.length > 0) {
        setResult({
          success: true,
          message: 'События уже существуют в базе данных',
          existingCount: existingEvents.length
        });
        return;
      }
      
      // Вставляем события в базу данных
      const { data, error } = await supabase
        .from('events')
        .insert(sampleEvents)
        .select();
      
      if (error) {
        throw new Error(`Ошибка при создании событий: ${error.message}`);
      }
      
      setResult({
        success: true,
        message: 'События успешно созданы',
        eventsCount: data.length,
        events: data
      });
    } catch (err) {
      console.error('Error creating test events:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Админ-панель</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Управление тестовыми данными
          </CardTitle>
          <CardDescription>
            Создание тестовых событий для демонстрации функциональности платформы
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {result && result.success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Успех</AlertTitle>
              <AlertDescription className="text-green-700">
                {result.message}
                {result.eventsCount !== undefined && ` Создано событий: ${result.eventsCount}`}
                {result.existingCount !== undefined && ` Количество существующих событий: ${result.existingCount}`}
              </AlertDescription>
            </Alert>
          )}
          
          <p className="mb-4">
            Эта функция создаст тестовые события в базе данных для демонстрации платформы.
            Используйте только в тестовом или демо-окружении.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={createTestEvents} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание тестовых событий...
              </>
            ) : (
              'Создать тестовые события'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}