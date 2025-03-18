import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserProfile } from '@/lib/actions/auth-actions';
import { defaultLocale } from '@/lib/i18n-config';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    console.log("AUTH CALLBACK HANDLER TRIGGERED:", requestUrl.toString());
    
    // Get code and error params
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    
    // Get additional context params
    const redirectTo = requestUrl.searchParams.get('redirect_to') || '/';
    const locale = requestUrl.searchParams.get('locale') || defaultLocale;
    
    // Log complete request context
    console.log("Auth callback params:", {
      code: code ? "present" : "absent",
      error: error || "none",
      redirectTo,
      locale,
      allParams: Object.fromEntries(requestUrl.searchParams.entries())
    });
    
    // Check for authentication errors
    if (error) {
      console.error("Auth error:", error);
      return NextResponse.redirect(new URL(`/${locale}/auth/error`, requestUrl.origin));
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // If we have a code, exchange it for a session
    if (code) {
      console.log("Exchanging code for session...");
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Session exchange error:", error);
        return NextResponse.redirect(new URL(`/${locale}/auth/error`, requestUrl.origin));
      }
      
      if (!data.user) {
        console.error("No user returned from session exchange");
        return NextResponse.redirect(new URL(`/${locale}/auth/error`, requestUrl.origin));
      }
      
      // Log successful authentication
      console.log("Authentication successful:", {
        user_id: data.user.id,
        email: data.user.email,
        provider: data.user.app_metadata?.provider
      });
      
      // Determine if this is OAuth flow
      const isOAuth = data.user.app_metadata?.provider !== 'email';
      
      if (isOAuth) {
        console.log("Processing OAuth login (Google, etc)");
        
        // Force profile creation for OAuth users
        try {
          // Prepare user data from OAuth profile
          const userData = {
            email: data.user.email || '',
            username: data.user.user_metadata?.name
              ? data.user.user_metadata.name.replace(/\s+/g, '_').toLowerCase()
              : data.user.email?.split('@')[0] || 'user',
            full_name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
            language: locale || defaultLocale
          };
          
          console.log("Creating/updating profile for OAuth user:", userData);
          
          // Explicitly create or update the user profile
          const result = await createUserProfile(data.user.id, userData);
          
          if (result.error) {
            console.error("Error creating profile:", result.error);
          } else {
            console.log("Profile created/updated successfully for OAuth user");
          }
        } catch (profileError) {
          console.error("Profile creation error:", profileError);
        }
      } else {
        console.log("Email authentication, profile will be created separately");
      }
    } else {
      console.error("No auth code provided");
      return NextResponse.redirect(new URL(`/${locale}/auth/error`, requestUrl.origin));
    }
    
    // Determine where to redirect the user
    const finalPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
    const finalUrl = new URL(`${finalPath}`, requestUrl.origin);
    
    console.log("Redirecting to:", finalUrl.toString());
    
    return NextResponse.redirect(finalUrl);
  } catch (err) {
    console.error("Unhandled exception in auth callback:", err);
    return NextResponse.redirect(new URL(`/en/auth/error`, request.url));
  }
}