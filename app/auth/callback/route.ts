// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale } from '@/lib/i18n-config';
import { Database } from '@/lib/types/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  console.log("Auth callback URL:", requestUrl.toString());
  
  // Проверяем код или ошибку в параметрах запроса
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  
  // Если есть ошибка, перенаправляем на страницу ошибки
  if (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
  }
  
  // Если есть код, обмениваем его на сессию
  if (code) {
    try {
      console.log("Processing auth code");
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
      
      // Обмен кода на сессию
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error("Error exchanging code for session:", exchangeError);
        return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
      }
      
      if (!data.session || !data.user) {
        console.error("No session or user after code exchange");
        return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
      }
      
      console.log("User authenticated, creating profile:", data.user.id);
      
      // Автоматически создаем профиль пользователя
      try {
        // Генерируем уникальный код
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Создаем запись пользователя
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: data.user.email || '',
            username: data.user.user_metadata?.username || `user_${data.user.id.substring(0, 8)}`,
            full_name: data.user.user_metadata?.full_name || '',
            language: data.user.user_metadata?.language || defaultLocale,
            referral_code: referralCode,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        
        if (userError) {
          console.error("Error creating user profile:", userError);
        } else {
          console.log("User profile created successfully");
          
          // Создаем начальный баланс
          const { error: balanceError } = await supabase
            .from('balances')
            .upsert({
              user_id: data.user.id,
              amount: 1000,
              currency: 'coins',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, currency' });
          
          if (balanceError) {
            console.error("Error creating balance:", balanceError);
          } else {
            console.log("Balance created successfully");
          }
        }
      } catch (createError) {
        console.error("Error in automatic profile creation:", createError);
      }
      
      // Перенаправляем на страницу входа с успехом
      console.log("Auth callback completed, redirecting to signin page");
      return NextResponse.redirect(new URL(`/${defaultLocale}/auth/signin?success=true`, requestUrl.origin));
    } catch (error) {
      console.error("Exception in auth callback:", error);
      return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
    }
  } else {
    console.error("No code found in auth callback URL");
    return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
  }
}