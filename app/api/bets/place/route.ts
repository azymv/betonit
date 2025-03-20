import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { placeBet } from '@/lib/actions/bet-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, userId, amount, prediction } = body;

    console.log('Received bet request:', { eventId, userId, amount, prediction });

    // Validate request data
    if (!eventId || !userId || !amount || prediction === undefined) {
      console.error('Missing required fields:', { eventId, userId, amount, prediction });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.id !== userId) {
      console.error('Unauthorized: User not authenticated or ID mismatch');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User authenticated, placing bet with action');
    
    // Place the bet using the server action
    const result = await placeBet({
      eventId,
      userId,
      amount,
      prediction
    });

    console.log('Bet placement result:', result);

    if (result.error) {
      console.error('Error placing bet:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      betId: result.betId,
      isFirstBet: result.isFirstBet
    });

  } catch (err) {
    console.error('Error in bet placement API:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 