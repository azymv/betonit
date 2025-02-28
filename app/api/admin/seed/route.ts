import { NextResponse } from 'next/server';
import { seedEvents } from '@/lib/actions/seed-events';

export async function GET() {
  try {
    // В реальном приложении здесь должна быть проверка прав доступа
    const result = await seedEvents();
    
    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, events: result.events }, { status: 200 });
  } catch (error) {
    console.error('Error seeding events:', error);
    return NextResponse.json({ success: false, error: 'Failed to seed events' }, { status: 500 });
  }
}