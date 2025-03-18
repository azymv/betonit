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