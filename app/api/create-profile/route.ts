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
    
    // Проверяем если профиль уже существует
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userData.userId || session.user.id)
      .single();
      
    // Если профиль уже существует, просто возвращаем успех
    if (existingProfile) {
      return NextResponse.json({ 
        success: true, 
        message: 'Profile already exists', 
        existing: true 
      });
    }
    
    // Если возникла ошибка проверки, но не из-за отсутствия профиля
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileCheckError);
      return NextResponse.json({ error: profileCheckError.message }, { status: 500 });
    }
    
    // Создаем профиль пользователя
    const result = await createUserProfile(userData.userId || session.user.id, {
      email: userData.email || session.user.email || '',
      username: userData.username || session.user.user_metadata?.username,
      full_name: userData.fullName || session.user.user_metadata?.full_name,
      language: userData.language || session.user.user_metadata?.language || 'en',
      referred_by: userData.referredBy || session.user.user_metadata?.referred_by,
    });
    
    if (result.error) {
      console.error('Error creating profile via API:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception in create-profile API:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}