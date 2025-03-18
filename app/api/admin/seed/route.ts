import { NextResponse, NextRequest } from 'next/server';
import { seedEvents } from '@/lib/actions/seed-events';

export async function GET(request: NextRequest) {
  try {
    // В реальном приложении здесь должна быть проверка прав доступа
    console.log('Seed events endpoint called...');
    
    // Проверяем наличие специального ключа в URL параметрах, чтобы избежать случайного вызова
    const url = new URL(request.url);
    const seedKey = url.searchParams.get('key');
    
    if (!seedKey || seedKey !== process.env.SEED_API_KEY) {
      console.log('Unauthorized seed attempt or missing API key');
      return NextResponse.json(
        { success: false, error: 'Unauthorized or missing API key' }, 
        { status: 401 }
      );
    }
    
    // Запускаем заполнение только с правильным ключом
    console.log('Starting seed events process with valid key...');
    const result = await seedEvents();
    
    console.log('Seed events result:', result);
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, events: result.events }, { status: 200 });
  } catch (error) {
    console.error('Unhandled error in seed endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, error: `Failed to seed events: ${errorMessage}` }, { status: 500 });
  }
}