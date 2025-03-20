import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Play API: Request received with full URL', request.url);
    
    // Log headers for debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Play API: Request headers:', JSON.stringify(headers, null, 2));
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const userId = searchParams.get('userId');

    console.log(`Play API: Request for page ${page}, pageSize ${pageSize}, userId ${userId}`);

    if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1 || pageSize > 50) {
      console.error('Play API: Invalid pagination parameters');
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    console.log('Play API: Creating Supabase client');
    
    try {
      const supabase = createRouteHandlerClient<Database>({ cookies });
      console.log('Play API: Supabase client created successfully');
      
      // Test authentication - not required for this endpoint but good to check
      console.log('Play API: Checking auth session');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Play API: Auth session error but continuing:', sessionError.message);
      } else {
        console.log('Play API: Auth session check complete, user:', sessionData?.session?.user?.id || 'no user');
      }
      
      // Fetch events for Play feed - using regular events for testing
      console.log(`Play API: Fetching events for page ${page}, pageSize ${pageSize}`);

      // Выполняем запрос без offset/range для предотвращения ошибки
      const { data: allEvents, error, count } = await supabase
        .from('events')
        .select(`
          id, 
          title, 
          short_description, 
          image_url, 
          end_time,
          status
        `, { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100); // Используем больший лимит и затем вручную пагинируем

      if (error) {
        console.error('Error fetching Play events:', error);
        return NextResponse.json(
          { error: 'Failed to fetch events', details: error.message },
          { status: 500 }
        );
      }

      console.log(`Play API: Found ${allEvents?.length || 0} events, total count: ${count || 0}`);

      // If no events found at all, return empty array
      if (!allEvents || allEvents.length === 0) {
        console.log('Play API: No events found, returning empty array');
        return NextResponse.json({
          events: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        });
      }

      // Выполняем пагинацию вручную
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, allEvents.length);
      const paginatedEvents = allEvents.slice(startIndex, endIndex);

      console.log(`Play API: Paginated to ${paginatedEvents.length} events for page ${page}`);

      // Transform the events to match the expected format
      interface EventData {
        id: string;
        title: string;
        short_description?: string;
        image_url?: string;
        end_time?: string;
        status?: string;
        media_url?: string;
        bet_closing_date?: string;
        has_user_bet?: boolean;
      }

      const transformedEvents: EventData[] = paginatedEvents.map((event) => {
        // Ensure image URLs have leading slash if they are relative paths
        let imageUrl = event.image_url || '';
        if (imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
          imageUrl = '/' + imageUrl;
        }
        
        return {
          ...event,
          image_url: imageUrl,
          media_url: imageUrl, // Use fixed image URL for media_url too
          bet_closing_date: event.end_time
        };
      });

      console.log(`Play API: Transformed events, first event title: ${transformedEvents[0]?.title}`);

      // If userId provided, check if user has already placed bets
      let eventsWithBetStatus: EventData[] = transformedEvents;
      if (userId) {
        console.log(`Play API: Checking bets for user ${userId}`);
        const { data: userBets, error: userBetsError } = await supabase
          .from('bets')
          .select('event_id')
          .eq('user_id', userId);

        if (userBetsError) {
          console.error('Error fetching user bets:', userBetsError);
        } else {
          console.log(`Play API: User has ${userBets?.length || 0} bets`);
          const userBetEventIds = new Set(userBets?.map(bet => bet.event_id) || []);
          eventsWithBetStatus = transformedEvents.map((event) => ({
            ...event,
            has_user_bet: userBetEventIds.has(event.id)
          }));
        }
      }

      const response = {
        events: eventsWithBetStatus,
        total: count || 0,
        page,
        pageSize,
        totalPages: count ? Math.ceil(count / pageSize) : 0
      };
      
      console.log(`Play API: Sending response with ${eventsWithBetStatus.length} events`);
      
      // Add CORS headers for good measure
      return NextResponse.json(response, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (supabaseError) {
      console.error('Supabase client error:', supabaseError);
      return NextResponse.json(
        { error: 'Database connection error', details: supabaseError instanceof Error ? supabaseError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (err) {
    console.error('Error in Play events API:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 