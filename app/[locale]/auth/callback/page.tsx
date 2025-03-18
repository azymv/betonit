'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string || 'en';
  const [message, setMessage] = useState("Завершаем авторизацию...");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Извлекаем все параметры из URL для отладки
    const allParams = Object.fromEntries(searchParams.entries());
    console.log("Auth callback page params:", allParams);

    try {
      // Обновляем сообщение для пользователя
      setMessage("Обрабатываем данные авторизации...");
      
      // Создаем URL для перенаправления на API-маршрут
      const currentUrl = new URL(window.location.href);
      const apiUrl = new URL('/auth/callback', currentUrl.origin);
      
      // Копируем все поисковые параметры
      searchParams.forEach((value, key) => {
        apiUrl.searchParams.append(key, value);
      });
      
      // Добавляем локаль, если ее нет в параметрах
      if (!apiUrl.searchParams.has('locale')) {
        apiUrl.searchParams.append('locale', locale);
      }
      
      // Добавляем явный параметр провайдера для Google
      if (!apiUrl.searchParams.has('provider') && 
          (currentUrl.pathname.includes('google') || 
           currentUrl.search.includes('google'))) {
        apiUrl.searchParams.append('provider', 'google');
      }
      
      // Если есть параметр redirectTo, убедимся что он корректно передан
      const redirectTo = searchParams.get('redirectTo');
      if (redirectTo && !apiUrl.searchParams.has('redirect_to')) {
        apiUrl.searchParams.set('redirect_to', redirectTo);
      }
      
      console.log("Redirecting to API route:", apiUrl.toString());
      
      // Обновляем сообщение перед перенаправлением
      setMessage("Перенаправление...");
      
      // Устанавливаем таймаут для перенаправления, чтобы пользователь увидел сообщение
      setTimeout(() => {
        // Перенаправляем на API-маршрут
        window.location.href = apiUrl.toString();
      }, 500);
    } catch (err) {
      console.error("Error in auth callback:", err);
      setError("Произошла ошибка при обработке авторизации");
      
      // Перенаправляем на страницу ошибки через 3 секунды
      setTimeout(() => {
        router.push(`/${locale}/auth/error`);
      }, 3000);
    }
  }, [searchParams, locale, router]);
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Ошибка авторизации</h2>
          <p>{error}</p>
          <p className="mt-4 text-sm text-muted-foreground">Перенаправление на страницу ошибки...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Авторизация</h2>
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}