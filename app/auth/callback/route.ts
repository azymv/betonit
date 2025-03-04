// app/auth/callback/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserProfile } from '@/lib/actions/auth-actions';
import { defaultLocale } from '@/lib/i18n-config';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  console.log("Auth callback URL:", requestUrl.toString());
  
  // Check for code in search params or error
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDesc = requestUrl.searchParams.get('error_description');
  
  // Log any errors from Supabase
  if (error || errorCode || errorDesc) {
    console.error("Auth callback error:", { error, errorCode, errorDesc });
    return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
  }
  
  // Handle auth code exchange
  if (code) {
    try {
      console.log("Processing auth code");
      const supabase = createRouteHandlerClient({ cookies });
      
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
      }
      
      if (data.user) {
        console.log("User authenticated:", data.user.id);
        
        // Получаем параметр ref из URL, если он есть
        const referralCode = requestUrl.searchParams.get('ref');
        let referrerId = null;
        
        // Если есть реферальный код, ищем пользователя
        if (referralCode) {
          console.log("Referral code found:", referralCode);
          try {
            const { data: referrerData } = await supabase
              .from('users')
              .select('id')
              .eq('referral_code', referralCode)
              .single();
              
            if (referrerData) {
              referrerId = referrerData.id;
              console.log("Found referrer:", referrerId);
              
              // Обновляем метаданные пользователя
              await supabase.auth.updateUser({
                data: { referred_by: referrerId }
              });
            }
          } catch (err) {
            console.error("Error finding referrer:", err);
          }
        } else {
          // Проверяем, есть ли реферальный код в метаданных пользователя
          referrerId = data.user.user_metadata?.referred_by;
        }
        
        // Создаем профиль пользователя
        const result = await createUserProfile(data.user.id, {
          email: data.user.email as string,
          username: data.user.user_metadata?.username,
          full_name: data.user.user_metadata?.full_name,
          language: data.user.user_metadata?.language || defaultLocale,
          referred_by: referrerId || data.user.user_metadata?.referred_by,
        });
        
        if (!result.success) {
          console.error("Error creating user profile:", result.error);
          // Продолжаем выполнение, так как главное - сессия создана
        }
      } else {
        console.error("No user found after code exchange");
      }
    } catch (error) {
      console.error("Exception in auth callback:", error);
      return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
    }
  } else {
    console.error("No code found in auth callback URL");
    return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
  }

  // Redirect to success page after verification
  console.log("Auth callback completed, redirecting to success page");
  return NextResponse.redirect(new URL(`/${defaultLocale}/auth/success`, requestUrl.origin));
}