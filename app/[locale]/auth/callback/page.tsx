'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Redirect to the base auth callback route
    const currentUrl = new URL(window.location.href);
    const newUrl = new URL('/auth/callback', currentUrl.origin);
    
    // Copy all search params
    searchParams.forEach((value, key) => {
      newUrl.searchParams.append(key, value);
    });
    
    // Redirect immediately
    window.location.href = newUrl.toString();
  }, [searchParams]);
  
  // Display a loading message while redirecting
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Перенаправление...</h2>
        <p>Пожалуйста, подождите, пока мы завершаем вашу аутентификацию.</p>
      </div>
    </div>
  );
}