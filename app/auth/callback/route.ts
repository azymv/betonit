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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
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
    
    // If there's no code, redirect to the sign-in page
    if (!code) {
      console.error('No code found in callback URL');
      return NextResponse.redirect(new URL('/en/auth/signin', request.url), {
        status: 303,
        headers
      });
    }

    // Create a Supabase client for the route handler
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Exchange the code for a session (this will use the code_verifier from the cookie)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/en/auth/signin?error=' + encodeURIComponent(error.message), request.url), {
        status: 303,
        headers
      });
    }

    // If successful, create a user profile
    if (data.session && data.user) {
      try {
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
          console.error('Error creating user profile:', userError);
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
    return NextResponse.redirect(new URL('/en/profile', request.url), {
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