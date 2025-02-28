import { NextResponse } from 'next/server';
import { seedEvents } from '@/lib/actions/seed-events';

export async function GET() {
  try {
    // В реальном приложении здесь должна быть проверка прав доступа
    console.log('Starting seed events process...');
    
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