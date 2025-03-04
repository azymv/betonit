'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Database } from '@/lib/types/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useAnalytics } from '@/components/analytics/analytics-provider';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userData?: {
    username?: string;
    full_name?: string;
    language?: string;
    referred_by?: string | null;
  }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  getUser: () => User | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  getUser: () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { track, identify, reset: resetAnalytics } = useAnalytics();
  
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    // Установливаем флаг загрузки при инициализации
    setIsLoading(true);
    
    const getInitialSession = async () => {
      try {
        // Устанавливаем таймаут для загрузки сессии
        const sessionTimeout = setTimeout(() => {
          console.log("Session loading timed out after 5 seconds");
          setIsLoading(false);
        }, 5000);
        
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        // Очищаем таймаут, так как сессия загружена
        clearTimeout(sessionTimeout);
        
        setSession(initialSession);
        
        if (initialSession) {
          const { data: { user: initialUser } } = await supabase.auth.getUser();
          setUser(initialUser);
          
          if (initialUser) {
            // Идентифицируем пользователя в аналитике
            identify(initialUser.id);
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        // В любом случае снимаем флаг загрузки
        setIsLoading(false);
      }
    };
    
    // Получаем начальную сессию
    getInitialSession();
    
    // Подписываемся на изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        // Устанавливаем флаг загрузки при изменении состояния аутентификации
        setIsLoading(true);
        
        // Устанавливаем таймаут для обработки изменения состояния
        const authChangeTimeout = setTimeout(() => {
          console.log("Auth state change processing timed out after 5 seconds");
          setIsLoading(false);
        }, 5000);
        
        try {
          setSession(currentSession);
          
          if (currentSession) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);
            
            if (currentUser) {
              // Идентифицируем пользователя в аналитике
              identify(currentUser.id);
              
              // Отслеживаем событие входа
              if (event === 'SIGNED_IN') {
                track('user_signed_in');
              }
            }
          } else {
            setUser(null);
            resetAnalytics();
            
            // Отслеживаем событие выхода
            if (event === 'SIGNED_OUT') {
              track('user_signed_out');
            }
          }
        } catch (error) {
          console.error("Error processing auth state change:", error);
        } finally {
          // В любом случае снимаем флаг загрузки и очищаем таймаут
          clearTimeout(authChangeTimeout);
          setIsLoading(false);
        }
      }
    );
    
    // Отписываемся при размонтировании компонента
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, track, identify, resetAnalytics]);

  const signIn = async (email: string, password: string) => {
    try {
      // Выполняем вход
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }
      
      // Принудительно обновляем сессию после входа
      await supabase.auth.getSession();
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, userData?: {
    username?: string;
    full_name?: string;
    language?: string;
    referred_by?: string | null;
  }) => {
    try {
      // Determine the correct site URL for redirects
      const siteUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://betonit-sepia.vercel.app';
      
      // First, just sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: {
            username: userData?.username,
            full_name: userData?.full_name,
            language: userData?.language || 'en',
            referred_by: userData?.referred_by,
          }
        },
      });
      
      if (error) {
        return { error };
      }
      
      // Track the sign-up event
      if (data.user) {
        track('user_signed_up', { 
          email, 
          username: userData?.username,
          language: userData?.language 
        });
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Сначала попробуем получить текущую сессию
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Если сессии нет, просто очищаем состояние
      if (!currentSession) {
        setUser(null);
        setSession(null);
        resetAnalytics();
        return { error: null };
      }
      
      // Если сессия есть, пытаемся выйти
      const { error } = await supabase.auth.signOut({
        scope: 'local' // Явно указываем локальный выход вместо глобального
      });
      
      // Даже если возникла ошибка, очищаем локальное состояние
      setUser(null);
      setSession(null);
      resetAnalytics();
      
      // Сообщаем об ошибке, но не прерываем процесс выхода
      if (error) {
        console.error("Error during sign out:", error);
      }
      
      return { error: null };
    } catch (error) {
      console.error("Exception during sign out:", error);
      
      // Даже при исключении очищаем состояние
      setUser(null);
      setSession(null);
      resetAnalytics();
      
      return { error: error as Error };
    }
  };
  
  const getUser = () => user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        getUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);