// file: app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserProfile } from '@/lib/actions/auth-actions';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
    
    // Get the user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Create the user profile
      await createUserProfile(user.id, {
        email: user.email as string,
        username: user.user_metadata.username,
        full_name: user.user_metadata.full_name,
        language: user.user_metadata.language,
      });
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin);
}