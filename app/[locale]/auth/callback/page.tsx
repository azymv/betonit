'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Простое перенаправление на базовый обработчик auth callback
    const currentUrl = new URL(window.location.href);
    const newUrl = new URL('/auth/callback', currentUrl.origin);
    
    // Копируем все параметры запроса
    searchParams.forEach((value, key) => {
      newUrl.searchParams.append(key, value);
    });
    
    try {
      console.log("Redirecting to auth callback:", newUrl.toString());
      window.location.href = newUrl.toString();
    } catch (e) {
      console.error("Error during redirect:", e);
      setError(true);
    }
  }, [searchParams, router]);
  
  // Показываем индикатор загрузки
  return (
    <div className="flex justify-center items-center h-screen">
      {error ? (
        <div className="text-center text-red-600">
          <p>Произошла ошибка при перенаправлении.</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" 
            onClick={() => router.push('/')}
          >
            Вернуться на главную
          </button>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Перенаправление...</h2>
          <p>Пожалуйста, подождите, пока мы завершаем вашу аутентификацию.</p>
        </div>
      )}
    </div>
  );
}