// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale } from '@/lib/i18n-config';
import { Database } from '@/lib/types/supabase';

// Определяем разрешенные домены для CORS
const allowedOrigins = [
  'https://betonit-sepia.vercel.app',
  'https://betonit.vercel.app',
  'http://localhost:3000'
];

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  console.log("Auth callback URL:", requestUrl.toString());
  
  // Получаем origin запроса
  const origin = request.headers.get('origin') || requestUrl.origin;
  
  // Проверяем код или ошибку в параметрах запроса
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDesc = requestUrl.searchParams.get('error_description');
  
  // Создаем базовый ответ с CORS заголовками
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
  
  // Если есть ошибка, перенаправляем на страницу ошибки
  if (error || errorCode || errorDesc) {
    console.error("Auth callback error:", { error, errorCode, errorDesc });
    const redirectUrl = new URL(`/${defaultLocale}/auth/error`, requestUrl.origin);
    return NextResponse.redirect(redirectUrl, {
      headers: corsHeaders
    });
  }
  
  // Если есть код, обмениваем его на сессию
  if (code) {
    try {
      console.log("Processing auth code");
      // Создаем клиент Supabase с правильными заголовками
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        const redirectUrl = new URL(`/${defaultLocale}/auth/error`, requestUrl.origin);
        return NextResponse.redirect(redirectUrl, {
          headers: corsHeaders
        });
      }
      
      // Получаем текущую сессию
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        console.error("No session or user after code exchange");
        const redirectUrl = new URL(`/${defaultLocale}/auth/error`, requestUrl.origin);
        return NextResponse.redirect(redirectUrl, {
          headers: corsHeaders
        });
      }
      
      console.log("Got session, user ID:", session.user.id);
      
      // Используем транзакционный подход для создания профиля
      try {
        // Генерируем реферальный код
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Начинаем транзакцию
        console.log("Starting profile creation transaction");
        
        // 1. Сначала создаем профиль пользователя
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || `user_${session.user.id.substring(0, 8)}`,
            full_name: session.user.user_metadata?.full_name || '',
            language: session.user.user_metadata?.language || defaultLocale,
            referred_by: session.user.user_metadata?.referred_by || null,
            referral_code: referralCode,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        
        if (userError) {
          console.error("Error creating user profile:", userError);
          throw userError;
        }
        
        console.log("User profile created successfully, creating balance");
        
        // 2. Затем создаем начальный баланс
        const { error: balanceError } = await supabase
          .from('balances')
          .upsert({
            user_id: session.user.id,
            amount: 1000,
            currency: 'coins',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (balanceError) {
          console.error("Error creating balance:", balanceError);
          throw balanceError;
        }
        
        console.log("Profile and balance created successfully");
      } catch (err) {
        console.error("Error in profile creation transaction:", err);
        // Продолжаем выполнение даже при ошибке создания профиля
      }
      
      // После успешного обмена перенаправляем на страницу профиля
      // Используем 303 See Other для принудительного GET запроса
      const redirectUrl = new URL(`/${defaultLocale}/profile`, requestUrl.origin);
      return NextResponse.redirect(redirectUrl, {
        status: 303,
        headers: corsHeaders
      });
    } catch (error) {
      console.error("Exception in auth callback:", error);
      const redirectUrl = new URL(`/${defaultLocale}/auth/error`, requestUrl.origin);
      return NextResponse.redirect(redirectUrl, {
        headers: corsHeaders
      });
    }
  } else {
    console.error("No code found in auth callback URL");
    const redirectUrl = new URL(`/${defaultLocale}/auth/error`, requestUrl.origin);
    return NextResponse.redirect(redirectUrl, {
      headers: corsHeaders
    });
  }
}

// Обработчик OPTIONS запросов для CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  
  // Возвращаем ответ с CORS заголовками
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}