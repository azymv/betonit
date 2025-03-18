import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    // Проверка API ключа для безопасности (простая реализация)
    const { apiKey } = await request.json();
    
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Инициализируем клиент Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    // Вызываем хранимую процедуру для обновления рангов
    const { error } = await supabase.rpc('update_leaderboard_ranks');
    
    if (error) {
      console.error('Error updating leaderboard ranks:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    // Сбрасываем кэш страницы лидерборда
    revalidatePath('/leaderboard');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception updating leaderboard ranks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}