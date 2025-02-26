import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { locales, defaultLocale } from './lib/i18n-config';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.[a-z]+$/i)
  ) {
    return NextResponse.next();
  }

  // Handle root path with rewrite
  if (pathname === '/') {
    return NextResponse.rewrite(new URL(`/${defaultLocale}`, request.url));
  }

  // Check if the path has a valid locale
  const pathnameHasValidLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Handle paths without locale
  if (!pathnameHasValidLocale) {
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
  }

  // Handle authentication for protected routes
  const locale = pathname.split('/')[1];
  const pathWithoutLocale = pathname.substring(locale.length + 1) || '/';
  
  const protectedRoutes = ['/profile', '/events/*/bet', '/referral'];
  const isProtectedRoute = protectedRoutes.some(route => {
    const regex = new RegExp(`^${route.replace('*', '.*')}$`);
    return regex.test(pathWithoutLocale);
  });

  if (isProtectedRoute) {
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });
    
    return supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        return NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url));
      }
      return response;
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};