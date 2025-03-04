// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale } from '@/lib/i18n-config';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  console.log("Auth callback URL:", requestUrl.toString());
  
  // Проверяем код или ошибку в параметрах запроса
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDesc = requestUrl.searchParams.get('error_description');
  
  // Если есть ошибка, перенаправляем на страницу ошибки
  if (error || errorCode || errorDesc) {
    console.error("Auth callback error:", { error, errorCode, errorDesc });
    return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
  }
  
  // Если есть код, обмениваем его на сессию
  if (code) {
    try {
      console.log("Processing auth code");
      const supabase = createRouteHandlerClient({ cookies });
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
      }
      
      // После успешного обмена перенаправляем на страницу входа с флагом успеха
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