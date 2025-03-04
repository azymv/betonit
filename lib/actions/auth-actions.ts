'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types/supabase';

// Функция для создания профиля пользователя
export async function createUserProfile(userId: string, userData: {
  email: string;
  username?: string;
  full_name?: string;
  language?: string;
  referred_by?: string | null;
}) {
  console.log("Starting createUserProfile for user:", userId);
  
  try {
    // First try regular client
    const supabase = createServerActionClient<Database>({ cookies });
    
    // Подробная проверка на существование пользователя
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (checkError) {
        if (checkError.code !== 'PGRST116') {
          console.error('Error checking if user exists:', checkError);
        } else {
          console.log('User profile does not exist, will create');
        }
      } else if (existingUser) {
        console.log('User profile already exists, skipping creation');
        return { success: true, existing: true, error: null };
      }
    } catch (checkEx) {
      console.error('Exception during user existence check:', checkEx);
    }
    
    // Use admin client if available, otherwise use regular client
    let client = supabase;
    
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Using service role client");
      try {
        client = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
      } catch (e) {
        console.error("Error creating service role client:", e);
      }
    } else {
      console.log("Service role key not available, using regular client");
      
      // Проверка, что у клиента есть доступ к таблице users
      try {
        const { error: accessCheckError } = await supabase
          .from('users')
          .select('count(*)')
          .limit(1);
          
        if (accessCheckError) {
          console.error('Client may not have access to users table:', accessCheckError);
        } else {
          console.log('Client has access to users table');
        }
      } catch (accessEx) {
        console.error('Exception during access check:', accessEx);
      }
    }
    
    // Generate a referral code
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Create user record in the users table with try/catch
    try {
      const { error: profileError } = await client
        .from('users')
        .insert({
          id: userId,
          email: userData.email,
          username: userData.username || `user_${userId.substring(0, 8)}`,
          full_name: userData.full_name,
          language: userData.language || 'en',
          referral_code: referralCode,
          referred_by: userData.referred_by,
        });
      
      if (profileError) {
        console.error('Error creating user profile:', profileError);
        return { success: false, error: profileError };
      }
      
      console.log("User profile created successfully");
    } catch (insertEx) {
      console.error('Exception during profile insertion:', insertEx);
      return { success: false, error: insertEx };
    }
    
    console.log("Creating initial balance");
    
    // Create an initial balance for the user
    try {
      const { error: balanceError } = await client
        .from('balances')
        .insert({
          user_id: userId,
          amount: 1000, // Initial balance of 1000 coins
          currency: 'coins',
        });
      
      if (balanceError) {
        console.error('Error creating initial balance:', balanceError);
        return { success: false, error: balanceError };
      }
      
      console.log("Initial balance created successfully");
    } catch (balanceEx) {
      console.error('Exception during balance creation:', balanceEx);
      return { success: false, error: balanceEx };
    }
    
    // If user was referred, process the referral reward
    if (userData.referred_by) {
      console.log(`User was referred by ${userData.referred_by}, processing reward...`);
      try {
        await processReferralReward(userData.referred_by, userId);
      } catch (refError) {
        console.error('Error processing referral reward:', refError);
        // Не возвращаем ошибку, так как профиль успешно создан
      }
    }
    
    // Верификация создания профиля
    try {
      const { data: verifyProfile, error: verifyError } = await client
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (verifyError) {
        console.error('Failed to verify profile creation:', verifyError);
      } else if (verifyProfile) {
        console.log("Profile creation verified successfully");
      }
    } catch (verifyEx) {
      console.error('Exception during profile verification:', verifyEx);
    }
    
    console.log("User setup completed successfully");
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception in createUserProfile:', error);
    return { success: false, error: error as Error };
  }
}

// Функция для обработки реферального вознаграждения
export async function processReferralReward(referrerId: string, referredId: string) {
  console.log(`Processing referral reward: referrer=${referrerId}, referred=${referredId}`);
  
  try {
    // Use admin client if available, otherwise use regular client
    let supabase;
    
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Using service role client for referral reward");
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    } else {
      console.log("Service role key not available, using regular client");
      supabase = createServerActionClient<Database>({ cookies });
    }
    
    // Create referral reward record
    const { error: rewardError } = await supabase
      .from('referral_rewards')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        status: 'completed',
      });
      
    if (rewardError) {
      console.error('Error creating referral reward:', rewardError);
      return { success: false, error: rewardError };
    }
    
    // Обновляем баланс реферера (+100 монет)
    const { success: referrerSuccess, error: referrerError } = await updateUserBalance(supabase, referrerId, 100);
    
    if (!referrerSuccess) {
      console.error('Error updating referrer balance:', referrerError);
      return { success: false, error: referrerError };
    }
    
    // Обновляем баланс приглашенного пользователя (+50 монет)
    const { success: referredSuccess, error: referredError } = await updateUserBalance(supabase, referredId, 50);
    
    if (!referredSuccess) {
      console.error('Error updating referred user balance:', referredError);
      return { success: false, error: referredError };
    }
    
    console.log("Referral reward processed successfully");
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception in processReferralReward:', error);
    return { success: false, error: error as Error };
  }
}

// Вспомогательная функция для обновления баланса
async function updateUserBalance(
  supabase: SupabaseClient, 
  userId: string, 
  amount: number
): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Получаем текущий баланс
    const { data: balanceData, error: balanceError } = await supabase
      .from('balances')
      .select('id, amount')
      .eq('user_id', userId)
      .eq('currency', 'coins')
      .single();
      
    if (balanceError) {
      if (balanceError.code === 'PGRST116') {
        // Если баланс не найден, создаем новый
        const { error: createError } = await supabase
          .from('balances')
          .insert({
            user_id: userId,
            amount: amount,
            currency: 'coins',
          });
          
        if (createError) {
          return { success: false, error: createError };
        }
      } else {
        return { success: false, error: balanceError };
      }
    } else {
      // Обновляем существующий баланс
      const { error: updateError } = await supabase
        .from('balances')
        .update({ 
          amount: balanceData.amount + amount,
          updated_at: new Date()
        })
        .eq('id', balanceData.id);
        
      if (updateError) {
        return { success: false, error: updateError };
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}