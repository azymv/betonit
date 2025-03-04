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
  
  // Проверяем, есть ли уже локаль в пути
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // Если путь не содержит локаль, добавляем локаль по умолчанию
  if (!pathnameHasLocale) {
    const url = new URL(`/${defaultLocale}${pathname}`, request.url);
    return NextResponse.redirect(url);
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};