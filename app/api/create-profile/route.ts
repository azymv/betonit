// app/api/create-profile/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/types/supabase';
import { createUserProfile } from '@/lib/actions/auth-actions';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Получаем текущую сессию для проверки авторизации
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Используем существующую функцию для создания профиля
    const result = await createUserProfile(userData.userId || session.user.id, {
      email: userData.email || session.user.email,
      username: userData.username || session.user.user_metadata?.username,
      full_name: userData.fullName || session.user.user_metadata?.full_name,
      language: userData.language || session.user.user_metadata?.language || 'en',
      referred_by: userData.referredBy || session.user.user_metadata?.referred_by,
    });
    
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in create-profile API:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}