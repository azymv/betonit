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
 * Создает или обновляет профиль пользователя после аутентификации
 * 
 * @param userId ID пользователя из Supabase Auth
 * @param userData Данные пользователя для создания/обновления профиля
 */
export async function createUserProfile(userId: string, userData: UserProfileData) {
  console.log("Creating/updating user profile for:", userId);
  
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Проверяем, существует ли уже профиль
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username, email, full_name, language, referral_code, referred_by')
      .eq('id', userId)
      .single();
    
    // Извлекаем данные пользователя из параметров
    const { email, username, full_name, language, referred_by } = userData;
    
    // Проверяем, имеет ли пользователь уже баланс
    const { data: userBalance, error: balanceCheckError } = await supabase
      .from('balances')
      .select('id, amount')
      .eq('user_id', userId)
      .single();
    
    if (balanceCheckError && balanceCheckError.code !== 'PGRST116') { // PGRST116 = запись не найдена
      console.error("Error checking user balance:", balanceCheckError);
    }
    
    const hasBalance = !!userBalance;
    console.log("User has balance:", hasBalance, userBalance ? `(${userBalance.amount} coins)` : '');
    
    if (existingUser) {
      console.log("User profile exists, updating if needed:", existingUser);
      
      // Подготавливаем данные для обновления, сохраняя существующие значения там, где новые не предоставлены
      const updateData = {
        email: email || existingUser.email,
        username: username || existingUser.username,
        full_name: full_name || existingUser.full_name,
        language: language || existingUser.language
      };
      
      // Добавляем referred_by только если оно указано и пока не установлено
      if (referred_by && !existingUser.referred_by) {
        Object.assign(updateData, { referred_by });
      }
      
      // Проверяем, нужно ли обновление (если хотя бы одно поле изменилось)
      const needsUpdate = Object.entries(updateData).some(
        ([key, value]) => value !== existingUser[key as keyof typeof existingUser]
      );
      
      if (needsUpdate) {
        console.log("Updating user profile with:", updateData);
        
        // Обновляем запись пользователя
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);
        
        if (updateError) {
          console.error("Error updating user:", updateError);
          return { error: updateError };
        }
        
        console.log("User profile updated successfully");
      } else {
        console.log("No updates needed for user profile");
      }
      
      // Если баланс не найден, создаем его (для пользователей OAuth)
      if (!hasBalance) {
        console.log("Creating initial balance for existing user");
        
        // Создаем начальный баланс для пользователя (1000 монет)
        const { error: balanceError } = await supabase
          .from('balances')
          .insert({
            user_id: userId,
            amount: 1000, // Начальный баланс
            currency: 'coins'
          });
        
        if (balanceError) {
          console.error("Error creating initial balance for existing user:", balanceError);
          return { error: balanceError };
        }
        
        console.log("Initial balance created successfully for existing user");
      }
      
      return { error: null };
    }
    
    // Если профиль не существует, создаем новый
    
    // Генерируем уникальный реферальный код
    const referralCode = generateReferralCode(userId);
    
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
    
    console.log("User profile and initial balance created successfully");
    return { error: null };
    
  } catch (error) {
    console.error("Exception creating/updating user profile:", error);
    return { error };
  }
}