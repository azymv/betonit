'use server';

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/supabase';
import { EventStatus } from '@/lib/types/event';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: {
  title: string;
  description: string;
  short_description: string;
  image_url: string;
  category: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
}) {
  // Check for required environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return { 
      success: false, 
      error: 'Missing required environment variables' 
    };
  }

  try {
    // Initialize Supabase admin client with service role key
    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey
    );

    // Insert event into database
    const { data, error } = await supabase
      .from('events')
      .insert([formData])
      .select();

    if (error) {
      console.error('Error creating event:', error);
      return { success: false, error: error.message };
    }

    // Update cache to show new event
    revalidatePath('/events');
    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, event: data[0] };
  } catch (err) {
    console.error('Exception in createEvent:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Удаляет события по их идентификаторам
 * @param eventIds Массив идентификаторов событий для удаления
 */
export async function deleteEvents(eventIds: string[]) {
  // Проверка необходимых переменных окружения
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return { 
      success: false, 
      error: 'Missing required environment variables' 
    };
  }

  if (!eventIds || eventIds.length === 0) {
    return {
      success: false,
      error: 'No event IDs provided'
    };
  }

  try {
    // Инициализируем Supabase клиент с ролью сервиса для админских действий
    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey
    );

    // Счетчик удаленных ставок
    let totalDeletedBets = 0;

    // Сначала удаляем все связанные ставки для каждого события
    for (const eventId of eventIds) {
      // Сначала проверяем, есть ли ставки на это событие
      const { count, error: countError } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      
      if (countError) {
        console.error(`Error checking bets for event ${eventId}:`, countError);
        return { success: false, error: `Failed to check related bets: ${countError.message}` };
      }
      
      if (count && count > 0) {
        console.log(`Found ${count} bets related to event ${eventId}. Deleting...`);
        totalDeletedBets += count;
        
        // Удаляем ставки, связанные с этим событием
        const { error: deleteError } = await supabase
          .from('bets')
          .delete()
          .eq('event_id', eventId);
        
        if (deleteError) {
          console.error(`Error deleting bets for event ${eventId}:`, deleteError);
          return { success: false, error: `Failed to delete related bets: ${deleteError.message}` };
        }
      }
    }

    // Теперь удаляем события
    const { error } = await supabase
      .from('events')
      .delete()
      .in('id', eventIds);

    if (error) {
      console.error('Error deleting events:', error);
      return { success: false, error: error.message };
    }

    // Обновляем кеш, чтобы изменения отобразились
    revalidatePath('/events');
    revalidatePath('/');
    revalidatePath('/admin');

    // Формируем сообщение об успешном удалении с учетом ставок
    const message = totalDeletedBets > 0
      ? `Successfully deleted ${eventIds.length} event(s) and ${totalDeletedBets} related bet(s)`
      : `Successfully deleted ${eventIds.length} event(s)`;

    return { 
      success: true, 
      message,
      deletedCount: eventIds.length,
      deletedBetsCount: totalDeletedBets
    };
  } catch (err) {
    console.error('Exception in deleteEvents:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    };
  }
}

export async function seedEvents() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return { 
      success: false, 
      error: 'Missing required environment variables' 
    };
  }

  try {
    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey
    );

    // Get current count of events
    const { count: existingCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    // Create test events
    const testEvents = [
      {
        title: 'Will Bitcoin reach $100k by the end of 2024?',
        description: 'Make a prediction about Bitcoin\'s price movement by the end of 2024.',
        short_description: 'Bitcoin price prediction for 2024',
        image_url: '/images/events/event_placeholder.png',
        category: 'cryptocurrency',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'active' as EventStatus
      },
      {
        title: 'Will AI surpass human intelligence by 2025?',
        description: 'Predict if artificial intelligence will achieve general intelligence by 2025.',
        short_description: 'AI development prediction',
        image_url: '/images/events/event_placeholder.png',
        category: 'technology',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        status: 'active' as EventStatus
      },
      {
        title: 'Will Mars colonization begin in 2025?',
        description: 'Predict if the first human mission to Mars will be launched in 2025.',
        short_description: 'Mars colonization prediction',
        image_url: '/images/events/event_placeholder.png',
        category: 'science',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        status: 'active' as EventStatus
      }
    ];

    const { data, error } = await supabase
      .from('events')
      .insert(testEvents)
      .select();

    if (error) {
      console.error('Error seeding events:', error);
      return { success: false, error: error.message };
    }

    // Update cache
    revalidatePath('/events');
    revalidatePath('/');
    revalidatePath('/admin');

    return { 
      success: true, 
      message: 'Test events created successfully',
      eventsCount: data.length,
      existingCount,
      events: data
    };
  } catch (err) {
    console.error('Exception in seedEvents:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    };
  }
}