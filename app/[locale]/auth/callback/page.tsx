'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Завершаем авторизацию...");
  
  useEffect(() => {
    // Explicitly log all params for debugging
    console.log("Auth callback params:", Object.fromEntries(searchParams.entries()));
    
    // Redirect to the API route that will handle the token exchange
    const currentUrl = new URL(window.location.href);
    const apiUrl = new URL('/auth/callback', currentUrl.origin);
    
    // Copy all search params
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });
    
    // Add explicit provider param
    if (!apiUrl.searchParams.has('provider') && currentUrl.pathname.includes('google')) {
      apiUrl.searchParams.append('provider', 'google');
    }
    
    console.log("Redirecting to API route:", apiUrl.toString());
    
    // Navigate to the API route
    window.location.href = apiUrl.toString();
  }, [searchParams]);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Авторизация Google</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}