'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateReferralCode } from '@/lib/utils/referral-utils';

interface UserProfileData {
  email: string;
  username?: string;
  full_name?: string;
  language?: string;
  referred_by?: string; // ID пользователя, пригласившего текущего
}

/**
 * Создает профиль пользователя после аутентификации
 * 
 * @param userId ID пользователя из Supabase Auth
 * @param userData Данные пользователя для создания профиля
 */
export async function createUserProfile(userId: string, userData: UserProfileData) {
  console.log("Creating user profile with data:", userData);
  
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
      referred_by: referred_by || null
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
        referred_by: referred_by || null
      });
    
    console.log("User creation result, error:", userError);
    
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
    
    // Если есть пригласивший, создаем запись в таблице referral_rewards
    // Награда будет начислена позже, после первой ставки
    if (referred_by) {
      const { error: referralError } = await supabase
        .from('referral_rewards')
        .insert({
          referrer_id: referred_by,
          referred_id: userId,
          status: 'pending' // Статус "ожидающий" - награда будет начислена после первой ставки
        });
      
      if (referralError) {
        console.error("Error creating referral reward record:", referralError);
        // Не возвращаем ошибку, так как основной профиль уже создан
      }
    }
    
    console.log("User profile created successfully");
    return { error: null };
    
  } catch (error) {
    console.error("Exception creating user profile:", error);
    return { error };
  }
}