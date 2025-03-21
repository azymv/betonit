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
  
  // Get redirect path and validate it using 'next' parameter (по документации)
  const next = requestUrl.searchParams.get('next');
  let validRedirectPath = `/${defaultLocale}/profile`;
  
  if (next) {
    try {
      // Make sure the redirectTo path starts with a slash
      const normalizedPath = next.startsWith('/') ? next : `/${next}`;
      
      // Simple validation to prevent open redirect vulnerabilities
      // Only accept relative paths within our app
      if (normalizedPath.startsWith('/') && !normalizedPath.includes('://')) {
        validRedirectPath = normalizedPath;
      }
    } catch (e) {
      console.error("Invalid redirect path:", e);
    }
  }
  
  // Get referral ID from URL if present
  const refId = requestUrl.searchParams.get('ref_id');
  if (refId) {
    console.log("Got referral ID from URL:", refId);
  } else {
    console.log("No referral ID found in URL params");
  }
  
  // Log the full URL and all search params for debugging
  console.log("Full callback URL:", requestUrl.toString());
  console.log("All URL search params:", Object.fromEntries(requestUrl.searchParams.entries()));
  console.log("Final redirect path:", validRedirectPath);
  
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
        console.log("User metadata:", data.user.user_metadata);
        
        // Обработка реферального кода
        const referredBy = data.user.user_metadata?.referred_by;
        
        if (referredBy) {
          console.log("User referred by:", referredBy);
        }
        
        // Создаем профиль пользователя
        try {
          // Если в метаданных есть referred_by, передаем его в createUserProfile
          const result = await createUserProfile(data.user.id, {
            email: data.user.email as string,
            username: data.user.user_metadata?.username,
            full_name: data.user.user_metadata?.full_name,
            language: data.user.user_metadata?.language,
            referred_by: refId || referredBy // Используем URL параметр или метаданные
          });
          
          if (result.error) {
            console.error("Error creating user profile:", result.error);
          } else {
            console.log("User profile created successfully");
            
            // Если указан реферер, обновляем поле referred_by в базе данных
            if (referredBy || refId) {
              try {
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ referred_by: refId || referredBy })
                  .eq('id', data.user.id);
                
                if (updateError) {
                  console.error("Error updating referred_by:", updateError);
                } else {
                  console.log("Successfully updated referred_by field");
                }
              } catch (refError) {
                console.error("Exception updating referred_by:", refError);
              }
            }
          }
        } catch (profileError) {
          console.error("Exception in createUserProfile:", profileError);
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

  // Handle X-Forwarded-Host для работы с нагрузочными балансировщиками
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  
  if (isLocalEnv) {
    console.log("Local environment detected, redirecting to:", validRedirectPath);
    return NextResponse.redirect(new URL(validRedirectPath, requestUrl.origin));
  } else if (forwardedHost) {
    console.log("Forwarded host detected:", forwardedHost, "redirecting to:", validRedirectPath);
    return NextResponse.redirect(new URL(validRedirectPath, `https://${forwardedHost}`));
  } else {
    console.log("Standard redirect to:", validRedirectPath);
    return NextResponse.redirect(new URL(validRedirectPath, requestUrl.origin));
  }
}