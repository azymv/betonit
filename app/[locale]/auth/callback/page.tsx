'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [redirectCount, setRedirectCount] = useState(0);
  
  useEffect(() => {
    // Предотвращаем бесконечный цикл перенаправлений
    if (redirectCount > 3) {
      setError('Слишком много перенаправлений. Пожалуйста, попробуйте войти снова.');
      return;
    }
    
    // Redirect to the base auth callback route
    const currentUrl = new URL(window.location.href);
    const newUrl = new URL('/auth/callback', currentUrl.origin);
    
    // Copy all search params
    const hasParams = searchParams.toString().length > 0;
    if (hasParams) {
      searchParams.forEach((value, key) => {
        newUrl.searchParams.append(key, value);
      });
      
      console.log("Redirecting to auth callback with params:", newUrl.toString());
      setRedirectCount(prev => prev + 1);
      
      // Redirect with a short timeout to avoid potential loops
      const timeout = setTimeout(() => {
        window.location.href = newUrl.toString();
      }, 100);
      
      return () => clearTimeout(timeout);
    } else {
      console.log("No search params found, redirecting to home");
      router.push('/');
    }
  }, [searchParams, router, redirectCount]);
  
  // Display a loading message while redirecting
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      {error ? (
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-md max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-red-700">Ошибка аутентификации</h2>
          <p className="text-red-600">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => router.push('/auth/signin')}
          >
            Вернуться на страницу входа
          </button>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4 mx-auto text-primary" />
          <h2 className="text-xl font-semibold mb-4">Перенаправление...</h2>
          <p>Пожалуйста, подождите, пока мы завершаем вашу аутентификацию.</p>
        </div>
      )}
    </div>
  );
}