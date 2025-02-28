import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserProfile } from '@/lib/actions/auth-actions';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      await supabase.auth.exchangeCodeForSession(code);
      
      // Get the user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create the user profile
        await createUserProfile(user.id, {
          email: user.email as string,
          username: user.user_metadata?.username,
          full_name: user.user_metadata?.full_name,
          language: user.user_metadata?.language,
        });
        console.log("User profile created successfully");
      }
    } catch (error) {
      console.error("Error in auth callback:", error);
      // Redirect to error page if there's an issue
      return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
    }
  }

  // URL to redirect to after sign in process completes
  // Redirect to your home page in English locale
  return NextResponse.redirect(new URL('/en', requestUrl.origin));
}