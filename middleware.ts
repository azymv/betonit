import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { locales, defaultLocale } from '@/lib/i18n-config';

export async function middleware(request: NextRequest) {
  // Получаем текущий путь
  const { pathname } = request.nextUrl;
  
  // Игнорируем статические файлы и API маршруты
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Файлы с расширением
  ) {
    return NextResponse.next();
  }
  
  // Создаем клиент Supabase для middleware
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  // Обновляем сессию, если необходимо
  await supabase.auth.getSession();
  
  // Проверяем, является ли запрос запросом на аутентификацию с кодом
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token = requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type');
  
  // Если это запрос на аутентификацию с кодом, перенаправляем на серверный обработчик
  // Но только если мы еще не находимся на странице /auth/callback
  if ((code || (token && type === 'signup')) && !pathname.includes('/auth/callback')) {
    console.log('Redirecting authentication request to server-side handler');
    
    // Сохраняем все параметры запроса
    const callbackUrl = new URL('/auth/callback', request.url);
    requestUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    
    // Важно: сохраняем все куки, особенно code_verifier для PKCE
    const response = NextResponse.redirect(callbackUrl);
    
    // Копируем все куки из запроса в ответ
    request.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value);
    });
    
    return response;
  }
  
  // Проверяем, есть ли уже локаль в пути
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // Если путь не содержит локаль, добавляем локаль по умолчанию
  if (!pathnameHasLocale) {
    const url = new URL(`/${defaultLocale}${pathname}`, request.url);
    
    // Копируем все параметры запроса
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    
    return NextResponse.redirect(url);
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};