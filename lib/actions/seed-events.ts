'use server';

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/supabase';
import { EventStatus } from '@/lib/types/event';

export async function seedEvents() {
  // Проверяем, что необходимые переменные окружения существуют
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return { 
      success: false, 
      error: 'Missing required environment variables' 
    };
  }

  try {
    // Инициализируем клиент Supabase с сервисной ролью для обхода RLS
    const supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey
    );

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
    const { data: existingEvents, error: checkError } = await supabaseAdmin
      .from('events')
      .select('id')
      .limit(1);
      
    if (checkError) {
      console.error('Error checking existing events:', checkError);
      return { 
        success: false, 
        error: `Error checking existing events: ${checkError.message}` 
      };
    }
    
    // Если события уже существуют, не добавляем новые
    if (existingEvents && existingEvents.length > 0) {
      return { 
        success: true, 
        message: 'Events already exist, no new events added', 
        eventsCount: existingEvents.length 
      };
    }

    // Вставляем события в базу данных
    const { data, error } = await supabaseAdmin
      .from('events')
      .insert(sampleEvents)
      .select();

    if (error) {
      console.error('Error creating seed events:', error);
      return { success: false, error: error.message };
    }

    return { success: true, events: data };
  } catch (err) {
    console.error('Exception in seedEvents:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    };
  }
}