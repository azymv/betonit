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
    const result = await createUserProfile(session.user.id, {
      email: userData.email,
      username: userData.username,
      full_name: userData.full_name,
      language: userData.language,
      referred_by: userData.referred_by,
    });
    
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}