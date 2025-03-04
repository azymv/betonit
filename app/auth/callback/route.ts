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
      // Создаем клиент Supabase с правильными заголовками
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
      }
      
      // Получаем текущую сессию
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        console.error("No session or user after code exchange");
        return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
      }
      
      console.log("Auth callback completed, user authenticated:", session.user.id);
      
      // Проверяем, существует ли профиль пользователя
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error checking user profile:", profileError);
      }
      
      // Если профиль не существует, создаем его
      if (!profileData) {
        console.log("Creating user profile after authentication");
        
        try {
          // Генерируем уникальный реферальный код
          const referralCode = Math.random().toString(36).substring(2, 10);
          
          // Создаем запись в таблице users
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
          } else {
            console.log("User profile created successfully");
            
            // Создаем начальный баланс
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
              console.error("Error creating initial balance:", balanceError);
            } else {
              console.log("Initial balance created successfully");
            }
          }
        } catch (err) {
          console.error("Exception in profile creation:", err);
        }
      }
      
      // После успешного обмена перенаправляем на страницу профиля
      return NextResponse.redirect(new URL(`/${defaultLocale}/profile`, requestUrl.origin));
    } catch (error) {
      console.error("Exception in auth callback:", error);
      return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
    }
  } else {
    console.error("No code found in auth callback URL");
    return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
  }
}