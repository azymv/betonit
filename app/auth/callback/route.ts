import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserProfile } from '@/lib/actions/auth-actions';
import { defaultLocale } from '@/lib/i18n-config';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  console.log("Auth callback URL:", requestUrl.toString());
  
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDesc = requestUrl.searchParams.get('error_description');
  
  // Log any errors from Supabase
  if (error || errorCode || errorDesc) {
    console.error("Auth callback error:", { error, errorCode, errorDesc });
    return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
  }
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    if (code) {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error("Error exchanging code for session:", exchangeError);
        return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
      }
      
      if (data.user) {
        console.log("User authenticated:", data.user.id);
        
        // Получаем параметр ref из URL, если он есть
        const referralCode = requestUrl.searchParams.get('ref');
        let referrerId = null;
        
        // Если есть реферальный код, ищем пользователя
        if (referralCode) {
          try {
            const { data: referrerData } = await supabase
              .from('users')
              .select('id')
              .eq('referral_code', referralCode)
              .single();
              
            if (referrerData) {
              referrerId = referrerData.id;
              
              // Обновляем метаданные пользователя
              await supabase.auth.updateUser({
                data: { referred_by: referrerId }
              });
            }
          } catch (err) {
            console.error("Error finding referrer:", err);
          }
        }
        
        // Create the user profile
        try {
          const result = await createUserProfile(data.user.id, {
            email: data.user.email as string,
            username: data.user.user_metadata?.username,
            full_name: data.user.user_metadata?.full_name,
            language: data.user.user_metadata?.language,
            referred_by: referrerId || data.user.user_metadata?.referred_by,
          });
          
          if (result.error) {
            console.error("Error creating user profile:", result.error);
          } else {
            console.log("User profile created successfully");
          }
        } catch (profileError) {
          console.error("Exception in createUserProfile:", profileError);
        }
      }
      
      // После успешной обработки кода перенаправляем на страницу успеха
      return NextResponse.redirect(new URL(`/${defaultLocale}/auth/success`, requestUrl.origin));
    }
    
    // Если нет кода, перенаправляем на главную
    return NextResponse.redirect(new URL(`/${defaultLocale}`, requestUrl.origin));
  } catch (error) {
    console.error("Exception in auth callback:", error);
    return NextResponse.redirect(new URL(`/${defaultLocale}/auth/error`, requestUrl.origin));
  }
}