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
      
      console.log("User authenticated:", data.user.id);
      
      // Теперь вместо перенаправления на профиль, перенаправляем на страницу входа с успехом
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