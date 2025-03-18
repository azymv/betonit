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
        image_url: '/images/events/placeholder.jpg',
        category: 'cryptocurrency',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'active' as EventStatus
      },
      {
        title: 'Will AI surpass human intelligence by 2025?',
        description: 'Predict if artificial intelligence will achieve general intelligence by 2025.',
        short_description: 'AI development prediction',
        image_url: '/images/events/placeholder.jpg',
        category: 'technology',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        status: 'active' as EventStatus
      },
      {
        title: 'Will Mars colonization begin in 2025?',
        description: 'Predict if the first human mission to Mars will be launched in 2025.',
        short_description: 'Mars colonization prediction',
        image_url: '/images/events/placeholder.jpg',
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