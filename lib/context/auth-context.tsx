'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userData?: {
    username?: string;
    full_name?: string;
    language?: string;
    referralCode?: string;
  }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  signInWithGoogle: (redirectUrl?: string, options?: {
    locale?: string;
    referralCode?: string;
  }) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Создаем клиент Supabase с правильными заголовками
  const supabase = createClientComponentClient({
    options: {
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  });

  useEffect(() => {
    // Получение начальной сессии
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getInitialSession();
    
    // Подписка на изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (event === 'SIGNED_OUT') {
          // При выходе просто очищаем состояние и перенаправляем на главную
          setSession(null);
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Авторизация через Google
  const signInWithGoogle = async (redirectUrl?: string, options?: {
    locale?: string;
    referralCode?: string;
  }) => {
    try {
      // Базовый URL для редиректа
      const siteUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://betonit-sepia.vercel.app';
      
      // Формируем URL для редиректа
      const finalRedirectUrl = redirectUrl || `${siteUrl}/auth/callback`;
      
      // Вызываем авторизацию через Google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectUrl,
          queryParams: {
            // Передаем дополнительные параметры
            ...(options?.locale ? { locale: options.locale } : {}),
            ...(options?.referralCode ? { ref: options.referralCode } : {})
          }
        }
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error("Error during Google sign in:", error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, userData?: {
    username?: string;
    full_name?: string;
    language?: string;
    referralCode?: string;
  }) => {
    try {
      // Базовый URL для редиректа после подтверждения
      const siteUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://betonit-sepia.vercel.app';
      
      // Определяем локаль для редиректа
      const locale = userData?.language || 'en';
      
      // Если указан реферальный код, получаем ID реферера
      let referrerId = null;
      
      if (userData?.referralCode) {
        try {
          console.log('Looking up referrer for code:', userData.referralCode);
          
          // Получаем ID реферера по коду
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', userData.referralCode)
            .single();
          
          if (error) {
            console.error('Error looking up referrer:', error);
          } else if (data) {
            referrerId = data.id; // ID пользователя, а не реферальный код
            console.log('Found referrer ID:', referrerId);
          }
        } catch (err) {
          console.error('Exception looking up referrer:', err);
        }
      }
      
      // В метаданные передаем ID реферера, а не реферальный код
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?redirect_to=/${locale}/profile`,
          data: {
            username: userData?.username,
            full_name: userData?.full_name,
            language: userData?.language || 'en',
            referred_by: referrerId // Передаем ID, а не код
          }
        },
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during sign out:", error);
        return { error };
      }
      
      // Принудительно очищаем состояние
      setUser(null);
      setSession(null);
      
      return { error: null };
    } catch (error) {
      console.error("Exception during sign out:", error);
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);