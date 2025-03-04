import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ANALYTICS_EVENTS } from '@/lib/analytics/mixpanel';

// Эндпоинт для отправки событий аналитики с серверной части
// Особенно полезно для реферальной программы, где события
// генерируются в server actions
export async function POST(request: NextRequest) {
  try {
    const { eventName, properties } = await request.json();
    
    // Проверяем, что указаны необходимые параметры
    if (!eventName) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }
    
    // Защита от отправки произвольных событий
    const allowedEvents = Object.values(ANALYTICS_EVENTS);
    if (!allowedEvents.includes(eventName)) {
      return NextResponse.json(
        { error: 'Invalid event name' },
        { status: 400 }
      );
    }
    
    // Получаем данные пользователя для проверки авторизации
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    // Если пользователь не авторизован, проверяем тип события
    // Некоторые события могут быть разрешены для неавторизованных пользователей
    if (!session && !['VIEW_EVENT', 'SIGN_UP', 'LOGIN'].includes(eventName)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Проверяем, что userId совпадает с авторизованным пользователем
    // для событий, требующих авторизации
    if (session && properties.userId && properties.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 403 }
      );
    }
    
    // Здесь должен быть код отправки события в Mixpanel
    // В реальном приложении это можно сделать через сервис, который обращается
    // к API Mixpanel или с использованием серверной библиотеки
    
    // Пример отправки события через fetch
    const mixpanelToken = process.env.MIXPANEL_SERVER_TOKEN;
    if (!mixpanelToken) {
      console.log('Mixpanel tracking disabled (no server token)');
      return NextResponse.json({ success: false, message: 'Analytics disabled' });
    }
    
    const payload = {
      event: eventName,
      properties: {
        token: mixpanelToken,
        distinct_id: properties.userId || 'anonymous',
        time: Date.now(),
        ...properties
      }
    };
    
    const response = await fetch('https://api.mixpanel.com/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to track event: ${response.statusText}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}