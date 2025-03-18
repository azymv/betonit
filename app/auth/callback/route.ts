import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserProfile } from '@/lib/actions/auth-actions';
import { defaultLocale } from '@/lib/i18n-config';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  console.log("Auth callback URL:", requestUrl.toString());
  
  // Проверяем наличие кода или ошибки в параметрах
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDesc = requestUrl.searchParams.get('error_description');
  
  // Получаем redirect_to из параметров URL для перенаправления после авторизации
  const redirectTo = requestUrl.searchParams.get('redirect_to');
  console.log("Redirect destination:", redirectTo || "Not specified");
  
  // Получаем реферальный код из параметров URL
  const ref = requestUrl.searchParams.get('ref');
  const refId = requestUrl.searchParams.get('ref_id');
  const locale = requestUrl.searchParams.get('locale') || defaultLocale;
  
  // Флаг для определения, является ли аутентификация через OAuth
  let isOAuthFlow = false;
  
  if (ref) {
    console.log("Got referral code from URL:", ref);
  } else if (refId) {
    console.log("Got referral ID from URL:", refId);
  } else {
    console.log("No referral code or ID found in URL params");
  }
  
  // Логируем полный URL и все параметры для отладки
  console.log("Full callback URL:", requestUrl.toString());
  console.log("All URL search params:", Object.fromEntries(requestUrl.searchParams.entries()));
  
  // Обрабатываем ошибки аутентификации
  if (error || errorCode || errorDesc) {
    console.error("Auth callback error:", { error, errorCode, errorDesc });
    return NextResponse.redirect(new URL(`/${locale}/auth/error`, requestUrl.origin));
  }
  
  // Обрабатываем обмен кода на сессию
  if (code) {
    try {
      console.log("Processing auth code");
      const supabase = createRouteHandlerClient({ cookies });
      
      // Обмениваем код на сессию
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(new URL(`/${locale}/auth/error`, requestUrl.origin));
      }
      
      if (data.user) {
        console.log("User authenticated:", data.user.id);
        console.log("User metadata:", data.user.user_metadata);
        console.log("Authentication provider:", data.user.app_metadata?.provider);
        
        // Определяем, использовал ли пользователь провайдер OAuth
        // Измененная логика определения OAuth аутентификации
        isOAuthFlow = data.user.app_metadata?.provider !== undefined && 
                      data.user.app_metadata.provider !== 'email';
        
        console.log("Is OAuth authentication:", isOAuthFlow);
        
        // Добавляем более подробное логирование данных пользователя
        console.log("Full user data:", {
          id: data.user.id,
          email: data.user.email,
          app_metadata: data.user.app_metadata,
          user_metadata: data.user.user_metadata,
          provider: data.user.app_metadata?.provider,
          isOAuthFlow
        });
        
        // Проверяем, существует ли уже профиль пользователя в нашей базе
        const { data: existingProfile, error: profileError } = await supabase
          .from('users')
          .select('id, username, language')
          .eq('id', data.user.id)
          .single();
        
        // PGRST116 означает, что запись не найдена
        const isNewUser = profileError && profileError.code === 'PGRST116';
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error checking user profile:", profileError);
        }
        
        // Упрощенное условие: создаем или обновляем профиль для новых пользователей или OAuth
        if (isNewUser || isOAuthFlow) {
          // Получаем информацию о реферере из метаданных или URL
          let referredBy = data.user.user_metadata?.referred_by;
          
          // Если в URL указан реферальный код, ищем ID реферера
          if (ref && !referredBy) {
            try {
              const { data: referrerData, error: referrerError } = await supabase
                .from('users')
                .select('id')
                .eq('referral_code', ref)
                .single();
                
              if (referrerError) {
                console.error("Error looking up referrer by code:", referrerError);
              } else if (referrerData) {
                referredBy = referrerData.id;
                console.log("Found referrer ID by code:", referredBy);
              }
            } catch (refLookupError) {
              console.error("Exception looking up referrer:", refLookupError);
            }
          }
          
          // Извлекаем имя пользователя и полное имя из данных провайдера
          const providerName = data.user.user_metadata?.name 
                            || data.user.user_metadata?.full_name 
                            || null;
          
          // Формируем данные пользователя из метаданных или OAuth профиля
          const userData = {
            email: data.user.email as string,
            username: data.user.user_metadata?.username || 
                     (providerName ? 
                      providerName.replace(/\s+/g, '_').toLowerCase() : 
                      data.user.email?.split('@')[0]),
            full_name: data.user.user_metadata?.full_name || 
                      providerName,
            language: data.user.user_metadata?.language || 
                     locale || 
                     (existingProfile ? existingProfile.language : null) || 
                     defaultLocale,
            referred_by: referredBy || refId || null
          };
          
          console.log("Creating/updating user profile with data:", userData);
          
          // Добавляем более подробное логирование перед созданием профиля
          console.log("Creating profile with final data:", userData);
          
          // Создаем или обновляем профиль пользователя
          try {
            const result = await createUserProfile(data.user.id, userData);
            
            if (result.error) {
              console.error("Error creating/updating user profile:", result.error);
            } else {
              console.log("User profile created/updated successfully");
            }
          } catch (profileError) {
            console.error("Exception in createUserProfile:", profileError);
          }
        } else {
          console.log("User profile already exists, skipping creation");
        }
      } else {
        console.error("No user found after code exchange");
      }
    } catch (error) {
      console.error("Exception in auth callback:", error);
      return NextResponse.redirect(new URL(`/${locale}/auth/error`, requestUrl.origin));
    }
  } else {
    console.error("No code found in auth callback URL");
    return NextResponse.redirect(new URL(`/${locale}/auth/error`, requestUrl.origin));
  }

  // Определяем куда перенаправить пользователя после аутентификации
  let finalRedirectUrl: URL;
  
  // Если это OAuth аутентификация (Google и другие провайдеры),
  // перенаправляем пользователя на страницу профиля
  if (isOAuthFlow) {
    // Перенаправляем в профиль пользователя, если не указано иное
    finalRedirectUrl = redirectTo 
      ? new URL(redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`, requestUrl.origin)
      : new URL(`/${locale}/profile`, requestUrl.origin);
      
    console.log("OAuth flow completed, redirecting to:", finalRedirectUrl.toString());
    return NextResponse.redirect(finalRedirectUrl);
  }
  
  // Для обычной email аутентификации сохраняем исходную логику
  if (redirectTo) {
    finalRedirectUrl = new URL(redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`, requestUrl.origin);
    console.log("Redirecting to specified URL:", finalRedirectUrl.toString());
    return NextResponse.redirect(finalRedirectUrl);
  }
  
  // Иначе перенаправляем на страницу успешной авторизации для подтверждения email
  console.log("Email authentication flow completed, redirecting to success page");
  return NextResponse.redirect(new URL(`/${locale}/auth/success`, requestUrl.origin));
}