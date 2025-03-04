'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Redirect to the base auth callback route
    // This ensures any verification tokens get passed to the API route
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
        <h2 className="text-xl font-semibold mb-4">Redirecting...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}