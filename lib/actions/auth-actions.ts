'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types/supabase';

// Функция для создания профиля пользователя
export async function createUserProfile(userId: string, userData: {
  email: string;
  username?: string;
  full_name?: string;
  language?: string;
}) {
  console.log("Creating user profile for:", userId);
  
  try {
    const supabase = createServerActionClient<Database>({ cookies });
    
    // Проверяем, существует ли уже профиль
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking if user exists:', checkError);
      return { success: false, error: checkError };
    }
    
    if (existingUser) {
      console.log('User profile already exists, skipping creation');
      return { success: true, existing: true };
    }
    
    // Создаем новый профиль
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userData.email,
        username: userData.username || `user_${userId.substring(0, 8)}`,
        full_name: userData.full_name || '',
        language: userData.language || 'en'
      });
    
    if (userError) {
      console.error('Error creating user profile:', userError);
      return { success: false, error: userError };
    }
    
    // Создаем начальный баланс
    const { error: balanceError } = await supabase
      .from('balances')
      .insert({
        user_id: userId,
        amount: 1000,
        currency: 'coins'
      });
    
    if (balanceError) {
      console.error('Error creating initial balance:', balanceError);
      return { success: false, error: balanceError };
    }
    
    console.log("User profile created successfully");
    return { success: true };
  } catch (error) {
    console.error('Exception in createUserProfile:', error);
    return { success: false, error };
  }
}