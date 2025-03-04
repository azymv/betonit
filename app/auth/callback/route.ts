import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Define allowed origins for CORS
const allowedOrigins = [
  'https://betonit-sepia.vercel.app',
  'https://betonit.vercel.app',
  'http://localhost:3000'
];

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be replaced with the actual origin
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, apikey',
  'Access-Control-Allow-Credentials': 'true',
};

export async function GET(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin') || '';
  
  // Set the appropriate CORS header based on the origin
  const headers = { ...corsHeaders };
  if (allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    headers['Access-Control-Allow-Origin'] = allowedOrigins[0];
  }

  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const token = requestUrl.searchParams.get('token');
    const type = requestUrl.searchParams.get('type');
    
    // If there's no code, redirect to the sign-in page
    if (!code) {
      console.error('No code found in callback URL');
      
      // If we have a token and it's a signup, redirect to the verify-email page
      if (token && type === 'signup') {
        console.log('Token found for signup, redirecting to verify-email page');
        const verifyEmailUrl = new URL('/en/auth/verify-email', request.url);
        verifyEmailUrl.searchParams.set('token', token);
        return NextResponse.redirect(verifyEmailUrl, {
          status: 303,
          headers
        });
      }
      
      return NextResponse.redirect(new URL('/en/auth/signin', request.url), {
        status: 303,
        headers
      });
    }
    
    // If we have a token but no code, redirect to the verify-email page
    if (token && !code) {
      // Only proceed if token is a string and starts with pkce_
      if (typeof token === 'string' && token.startsWith('pkce_')) {
        console.log('Token found but no code, redirecting to verify-email page');
        const verifyEmailUrl = new URL('/en/auth/verify-email', request.url);
        verifyEmailUrl.searchParams.set('token', token);
        return NextResponse.redirect(verifyEmailUrl, {
          status: 303,
          headers
        });
      }
    }

    // Create a Supabase client for the route handler
    const cookieStore = cookies();
    
    // Log all cookies to help debug PKCE issues
    const allCookies = cookieStore.getAll();
    console.log('All cookies:', allCookies.map(c => c.name));
    
    // Check for the code_verifier cookie specifically
    const codeVerifier = cookieStore.get('code_verifier');
    console.log('Code verifier cookie exists:', !!codeVerifier);
    
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore
    });
    
    // Ensure API key is included in the request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('Supabase URL exists:', !!supabaseUrl);
    console.log('Supabase API key exists:', !!supabaseKey);
    
    // Create headers for the Supabase request
    const requestHeaders = new Headers();
    requestHeaders.append('apikey', supabaseKey || '');
    requestHeaders.append('Authorization', `Bearer ${supabaseKey}`);
    
    // Exchange the code for a session (this will use the code_verifier from the cookie)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      
      // Check if the error is due to missing code verifier
      if (error.message.includes('code verifier should be non-empty') || error.message.includes('both auth code')) {
        console.log('Code verifier missing, attempting to handle verification directly');
        
        // Extract token from the URL
        const token = requestUrl.searchParams.get('token');
        
        if (token && token.startsWith('pkce_')) {
          try {
            // If we have a PKCE token but no code verifier, we can try to verify the email directly
            // by extracting the email from the token (if possible) or redirecting to a special page
            
            // Redirect to a special page that will handle the verification
            return NextResponse.redirect(new URL(`/en/auth/verify-email?token=${token}`, request.url), {
              status: 303,
              headers
            });
          } catch (verifyError) {
            console.error('Error handling direct verification:', verifyError);
          }
        }
        
        return NextResponse.redirect(new URL('/en/auth/signin?error=code_verifier_missing&message=' + encodeURIComponent('Ошибка аутентификации: отсутствует код верификации. Пожалуйста, попробуйте войти снова.'), request.url), {
          status: 303,
          headers
        });
      }
      
      // Check if the error is due to an expired token
      if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('access_denied')) {
        console.log('Token expired or invalid, redirecting to sign-in with specific error');
        return NextResponse.redirect(new URL('/en/auth/signin?error=expired_link&message=' + encodeURIComponent('Ссылка для подтверждения email устарела или недействительна. Пожалуйста, запросите новую ссылку.'), request.url), {
          status: 303,
          headers
        });
      }
      
      return NextResponse.redirect(new URL('/en/auth/signin?error=' + encodeURIComponent(error.message), request.url), {
        status: 303,
        headers
      });
    }

    // If successful, create a user profile
    if (data.session && data.user) {
      try {
        console.log('Creating user profile for:', data.user.id, data.user.email);
        
        // Generate a unique referral code
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Create or update the user record
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: data.user.email || '',
            username: data.user.user_metadata?.username || `user_${data.user.id.substring(0, 8)}`,
            full_name: data.user.user_metadata?.full_name || '',
            language: data.user.user_metadata?.language || 'en',
            referral_code: referralCode,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        
        if (userError) {
          console.error('Error creating user profile:', userError.message, userError.details, userError.hint);
        } else {
          console.log('User profile created successfully');
          
          // Create initial balance
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
            console.error('Error creating balance:', balanceError);
          } else {
            console.log('Balance created successfully');
          }
        }
      } catch (profileError) {
        console.error('Error in profile creation:', profileError);
      }
    }

    // Redirect to the profile page
    const redirectTo = requestUrl.searchParams.get('redirect_to') || '/en/profile';
    
    return NextResponse.redirect(new URL(redirectTo, request.url), {
      status: 303,
      headers
    });
  } catch (err) {
    console.error('Unexpected error in auth callback:', err);
    return NextResponse.redirect(new URL('/en/auth/signin?error=unexpected', request.url), {
      status: 303,
      headers
    });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin') || '';
  
  // Set the appropriate CORS header based on the origin
  const headers = { ...corsHeaders };
  if (allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    headers['Access-Control-Allow-Origin'] = allowedOrigins[0];
  }

  return new NextResponse(null, {
    status: 204,
    headers
  });
} 