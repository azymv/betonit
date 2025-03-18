'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateReferralCode } from '../utils/referral-utils'; // Обновленный импорт

interface UserProfileData {
  email: string;
  username?: string;
  full_name?: string;
  language?: string;
  referred_by?: string; // Поле для ID пригласившего пользователя
}

/**
 * Создает профиль пользователя после аутентификации
 * 
 * @param userId ID пользователя из Supabase Auth
 * @param userData Данные пользователя для создания профиля
 */
export async function createUserProfile(userId: string, userData: UserProfileData) {
  console.log("Creating user profile for:", userId);
  
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Проверяем, существует ли уже профиль
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existingUser) {
      console.log("User profile already exists, skipping creation");
      return { error: null };
    }
    
    // Генерируем уникальный реферальный код
    const referralCode = generateReferralCode(userId);
    
    // Извлекаем данные пользователя из параметров
    const { email, username, full_name, language, referred_by } = userData;
    
    console.log("Creating new user profile with data:", {
      email,
      username: username || null, 
      full_name: full_name || null,
      language: language || 'en',
      referral_code: referralCode,
      referred_by: referred_by || null // Логируем значение
    });
    
    // Создаем запись пользователя в базе данных
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        username: username || null,
        full_name: full_name || null,
        language: language || 'en',
        referral_code: referralCode,
        referred_by: referred_by || null // Сохраняем ID пригласившего
      });
    
    if (userError) {
      console.error("Error creating user:", userError);
      return { error: userError };
    }
    
    // Создаем начальный баланс для пользователя (1000 монет)
    const { error: balanceError } = await supabase
      .from('balances')
      .insert({
        user_id: userId,
        amount: 1000, // Начальный баланс
        currency: 'coins'
      });
    
    if (balanceError) {
      console.error("Error creating initial balance:", balanceError);
      return { error: balanceError };
    }
    
    console.log("User profile created successfully");
    return { error: null };
    
  } catch (error) {
    console.error("Exception creating user profile:", error);
    return { error };
  }
}