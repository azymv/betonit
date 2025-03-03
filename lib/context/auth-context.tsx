'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

  // Добавьте новую функцию для проверки и создания профиля
  const ensureUserProfile = async (user: User) => {
    try {
      console.log('Ensuring user profile exists for:', user.id);
      
      // Проверяем, что пользователь действительно существует в auth.users
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser?.user) {
        console.error("User not found in auth.users:", authError);
        return false;
      }
      
      // Проверяем, существует ли профиль
      const { error } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (error && error.code === 'PGRST116') {
        console.log('User profile does not exist, creating one...');
        
        // Добавляем задержку перед созданием профиля
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Профиль не существует, создаем его через API
        const response = await fetch('/api/create-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            username: user.user_metadata?.username,
            fullName: user.user_metadata?.full_name,
            language: user.user_metadata?.language,
            referredBy: user.user_metadata?.referred_by,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to create profile:", errorData.error);
          return false;
        } else {
          console.log("User profile created successfully");
          return true;
        }
      }
      
      console.log('User profile already exists');
      return true;
    } catch (e) {
      console.error("Error ensuring user profile exists:", e);
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          identify(initialSession.user.id);
          
          // Проверяем и создаем профиль при необходимости
          await ensureUserProfile(initialSession.user);
        }
        
        setSession(initialSession);
        setUser(initialSession?.user || null);
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getInitialSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, changedSession) => {
        try {
          setIsLoading(true);
          
          console.log('Auth state changed:', event, changedSession?.user?.id);
          
          if (event === 'SIGNED_IN' && changedSession?.user) {
            identify(changedSession.user.id);
            track(ANALYTICS_EVENTS.LOGIN, {
              userId: changedSession.user.id,
              email: changedSession.user.email,
            });
            
            // Добавляем задержку перед созданием профиля
            // чтобы дать Supabase время на завершение процесса подтверждения email
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Сначала проверяем, что пользователь действительно существует в auth.users
            const { data: authUser, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
              console.error("Error getting auth user:", authError);
              return;
            }
            
            if (authUser?.user) {
              // Проверяем и создаем профиль при необходимости
              await ensureUserProfile(authUser.user);
            }
            
            // Обновляем страницу только при входе
            router.refresh();
          } else if (event === 'SIGNED_OUT') {
            resetAnalytics();
            track(ANALYTICS_EVENTS.LOGOUT);
            
            // Обновляем страницу только при выходе
            router.refresh();
          }
          
          setSession(changedSession);
          setUser(changedSession?.user || null);
        } catch (error) {
          console.error("Error in auth state change:", error);
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, identify, track, resetAnalytics]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }
      
      // Проверяем и создаем профиль при входе
      if (data.user) {
        await ensureUserProfile(data.user);
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: {
    username?: string;
    full_name?: string;
    language?: string;
    referred_by?: string | null;
  }) => {
    try {
      setIsLoading(true);
      
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
            referred_by: userData?.referred_by || null,
          }
        },
      });
      
      if (error) {
        return { error };
      }
      
      // Track the sign-up event
      if (data.user) {
        track(ANALYTICS_EVENTS.SIGN_UP, { 
          email, 
          username: userData?.username,
          language: userData?.language,
          referred_by: userData?.referred_by
        });
        
        // Добавляем задержку перед созданием профиля
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Создаем профиль пользователя
        await ensureUserProfile(data.user);
        
        // Если есть реферальный код, обрабатываем его
        if (userData?.referred_by) {
          try {
            // Находим ID реферера по коду
            const { data: referrerData, error: referrerError } = await supabase
              .from('users')
              .select('id')
              .eq('referral_code', userData.referred_by)
              .single();
              
            if (!referrerError && referrerData?.id) {
              // Импортируем и вызываем функцию обработки реферальной награды
              const { processReferralReward } = await import('@/lib/actions/referral-actions');
              await processReferralReward(referrerData.id, data.user.id);
            }
          } catch (refError) {
            console.error('Error processing referral:', refError);
          }
        }
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
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
      const { error } = await supabase.auth.signOut();
      
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