'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    // Добавляем задержку перед перенаправлением
    const timer = setTimeout(() => {
      // Простое перенаправление на базовый обработчик auth callback
      const currentUrl = new URL(window.location.href);
      const newUrl = new URL('/auth/callback', currentUrl.origin);
      
      // Копируем все параметры запроса вручную
      if (searchParams) {
        searchParams.forEach((value, key) => {
          newUrl.searchParams.append(key, value);
        });
      }
      
      console.log("Redirecting to auth callback:", newUrl.toString());
      window.location.href = newUrl.toString();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [searchParams, router]);
  
  // Показываем индикатор загрузки
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Перенаправление...</h2>
        <p>Пожалуйста, подождите, пока мы завершаем вашу аутентификацию.</p>
      </div>
    </div>
  );
}