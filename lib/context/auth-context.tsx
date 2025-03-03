'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Database } from '@/lib/types/supabase';
import { Session, User } from '@supabase/supabase-js';
import { ANALYTICS_EVENTS } from '@/lib/analytics/mixpanel';
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

  // Функция для проверки и создания профиля пользователя
  const ensureUserProfile = useCallback(async (currentUser: User) => {
    if (!currentUser) return;
    
    try {
      console.log("Checking if user profile exists for:", currentUser.id);
      
      // Проверяем существование профиля с максимальной надежностью
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', currentUser.id)
        .single();
      
      // Если профиль найден, ничего не делаем
      if (!error && data) {
        console.log("User profile exists. No action needed.");
        return;
      }
      
      // Если профиль не найден (или возникла другая ошибка), создаем профиль
      // используя серверное действие
      if (error) {
        console.log("Error or profile not found, creating profile via server action");
        
        // Используем серверное действие из auth-actions
        const { createProfileIfNeeded } = await import('@/lib/actions/auth-actions');
        
        const result = await createProfileIfNeeded(currentUser.id, {
          email: currentUser.email || '',
          username: currentUser.user_metadata?.username,
          full_name: currentUser.user_metadata?.full_name,
          language: currentUser.user_metadata?.language || 'en',
          referred_by: currentUser.user_metadata?.referred_by,
        });
        
        if (!result.success) {
          console.error("Failed to create user profile:", result.error);
        } else {
          console.log("User profile created/verified successfully");
        }
      }
    } catch (err) {
      console.error("Error in ensureUserProfile:", err);
    }
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user || null);
        
        if (initialSession?.user) {
          identify(initialSession.user.id);
          
          // Проверяем существование профиля и создаем его при необходимости
          await ensureUserProfile(initialSession.user);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    getInitialSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, changedSession) => {
        console.log("Auth state changed:", event);
        setSession(changedSession);
        setUser(changedSession?.user || null);
        
        if (event === 'SIGNED_IN' && changedSession?.user) {
          identify(changedSession.user.id);
          track(ANALYTICS_EVENTS.LOGIN, {
            userId: changedSession.user.id,
            email: changedSession.user.email,
          });
          
          // Проверяем существование профиля и создаем его при необходимости
          await ensureUserProfile(changedSession.user);
        } else if (event === 'SIGNED_OUT') {
          resetAnalytics();
          track(ANALYTICS_EVENTS.LOGOUT);
        }
        
        router.refresh();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, identify, track, resetAnalytics, ensureUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }
      
      // После успешного входа проверяем и создаем профиль при необходимости
      if (data.user) {
        await ensureUserProfile(data.user);
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
      
      // Если регистрация произошла без подтверждения email (в режиме разработки),
      // то можно создать профиль сразу
      if (data.user && !data.session) {
        console.log("User registered but no session yet (email confirmation required)");
      } else if (data.user && data.session) {
        console.log("User registered with session, creating profile immediately");
        await ensureUserProfile(data.user);
      }
      
      // Track the sign-up event
      if (data.user) {
        track(ANALYTICS_EVENTS.SIGN_UP, { 
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