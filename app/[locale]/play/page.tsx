'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import PlayFeed from "@/components/play/PlayFeed";
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

export default function Play() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClientComponentClient();
  const params = useParams();
  const locale = params.locale as string;
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          setUserId(data.session.user.id);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [supabase.auth]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-xl mb-10">
            {locale === 'en' 
              ? 'Register to try BetOnIt Play and make your predictions about future events.' 
              : 'Зарегистрируйтесь, чтобы попробовать BetOnIt Play и делать предсказания о будущих событиях.'}
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Button asChild variant="secondary" className="text-black font-medium">
              <Link href={`/${locale}/auth/signup`}>
                {locale === 'en' ? 'Sign up now' : 'Пройти регистрацию'}
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white text-white bg-black hover:bg-black hover:text-white hover:border-white">
              <Link href={`/${locale}/auth/signin`}>
                {locale === 'en' ? 'Sign in' : 'Войти'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      {userId && <PlayFeed userId={userId} />}
    </div>
  );
} 