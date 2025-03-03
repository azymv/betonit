// app/api/create-profile/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/types/supabase';
import { createUserProfile } from '@/lib/actions/auth-actions';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Если пользователь не авторизован, но передан userId, используем его
    // Это позволяет создавать профиль для только что зарегистрированного пользователя
    if (userData.userId) {
      console.log("Creating profile with userId from request:", userData.userId);
      
      const result = await createUserProfile(userData.userId, {
        email: userData.email || '',
        username: userData.username,
        full_name: userData.fullName,
        language: userData.language || 'en',
        referred_by: userData.referredBy,
      });
      
      if (result.error) {
        console.error('Error creating profile via API:', result.error);
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Если userId не передан, пытаемся получить текущего пользователя из сессии
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No session found and no userId provided');
      return NextResponse.json({ error: 'Unauthorized - no session or userId' }, { status: 401 });
    }
    
    // Далее создаем профиль для авторизованного пользователя
    // ... оставшаяся логика без изменений
  } catch (error) {
    console.error('Exception in create-profile API:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}