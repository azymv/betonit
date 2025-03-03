// lib/actions/referral-actions.ts
'use server';

import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';

// Генерация уникального реферального кода
export async function generateReferralCode() {
  const supabase = createServerActionClient<Database>({ cookies });
  
  // Получаем текущего пользователя
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }
  
  // Проверяем, есть ли уже реферальный код
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('username, referral_code')
    .eq('id', session.user.id)
    .single();
    
  if (userError) {
    return { success: false, message: userError.message };
  }
  
  // Если код уже есть, возвращаем его
  if (userData.referral_code) {
    return { success: true, code: userData.referral_code };
  }
  
  // Создаем новый код
  const username = userData.username || session.user.email?.split('@')[0] || '';
  const prefix = username.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const referralCode = `${prefix}${randomPart}`;
  
  // Сохраняем код в базе данных
  const { error: updateError } = await supabase
    .from('users')
    .update({ referral_code: referralCode })
    .eq('id', session.user.id);
    
  if (updateError) {
    return { success: false, message: updateError.message };
  }
  
  return { success: true, code: referralCode };
}

// Обработка реферальной награды
export async function processReferralReward(referrerId: string, newUserId: string) {
  const supabase = createServerActionClient<Database>({ cookies });
  console.log(`Processing referral reward: referrer=${referrerId}, newUser=${newUserId}`);
  
  // Начинаем транзакцию для обработки реферальной награды
  try {
    // 1. Создаем запись в таблице referral_rewards
    const { error: rewardError } = await supabase
      .from('referral_rewards')
      .insert({
        referrer_id: referrerId,
        referred_id: newUserId,
        referrer_amount: 100, // Реферер получает 100 монет
        referred_amount: 50,  // Новый пользователь получает 50 монет
        status: 'completed'
      });
      
    if (rewardError) {
      console.error("Error creating referral reward:", rewardError);
      throw rewardError;
    }
    
    // 2. Обновляем баланс реферера
    const { data: referrerBalance, error: referrerBalanceError } = await supabase
      .from('balances')
      .select('amount')
      .eq('user_id', referrerId)
      .eq('currency', 'coins')
      .single();
      
    if (referrerBalanceError && referrerBalanceError.code !== 'PGRST116') {
      console.error("Error getting referrer balance:", referrerBalanceError);
      throw referrerBalanceError;
    }
    
    const referrerAmount = (referrerBalance?.amount || 0) + 100;
    
    const { error: updateReferrerError } = await supabase
      .from('balances')
      .upsert({
        user_id: referrerId,
        amount: referrerAmount,
        currency: 'coins',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, currency' });
      
    if (updateReferrerError) {
      console.error("Error updating referrer balance:", updateReferrerError);
      throw updateReferrerError;
    }
    
    // 3. Обновляем баланс нового пользователя
    const { data: newUserBalance, error: newUserBalanceError } = await supabase
      .from('balances')
      .select('amount')
      .eq('user_id', newUserId)
      .eq('currency', 'coins')
      .single();
      
    if (newUserBalanceError && newUserBalanceError.code !== 'PGRST116') {
      console.error("Error getting new user balance:", newUserBalanceError);
      throw newUserBalanceError;
    }
    
    const newUserAmount = (newUserBalance?.amount || 1000) + 50;
    
    const { error: updateNewUserError } = await supabase
      .from('balances')
      .upsert({
        user_id: newUserId,
        amount: newUserAmount,
        currency: 'coins',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, currency' });
      
    if (updateNewUserError) {
      console.error("Error updating new user balance:", updateNewUserError);
      throw updateNewUserError;
    }
    
    // 4. Создаем транзакции для обоих пользователей
    // Для реферера
    const { error: referrerTxError } = await supabase
      .from('transactions')
      .insert({
        user_id: referrerId,
        amount: 100,
        currency: 'coins',
        type: 'referral_reward',
        status: 'completed',
        metadata: { referred_user_id: newUserId }
      });
      
    if (referrerTxError) {
      console.error("Error creating referrer transaction:", referrerTxError);
      throw referrerTxError;
    }
    
    // Для нового пользователя
    const { error: newUserTxError } = await supabase
      .from('transactions')
      .insert({
        user_id: newUserId,
        amount: 50,
        currency: 'coins',
        type: 'referral_reward',
        status: 'completed',
        metadata: { referrer_id: referrerId }
      });
      
    if (newUserTxError) {
      console.error("Error creating new user transaction:", newUserTxError);
      throw newUserTxError;
    }
    
    console.log("Successfully processed referral reward");
    return { success: true };
  } catch (error) {
    console.error("Error in processReferralReward:", error);
    throw error;
  }
}

// Получение статистики рефералов
export async function getReferralStats() {
  const supabase = createServerActionClient<Database>({ cookies });
  
  // Получаем текущего пользователя
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }
  
  // Получаем количество успешных рефералов
  const { count, error: countError } = await supabase
    .from('referral_rewards')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', session.user.id)
    .eq('status', 'completed');
    
  if (countError) {
    return { success: false, message: countError.message };
  }
  
  // Получаем сумму заработанных монет
  const { data: rewardsData, error: rewardsError } = await supabase
    .from('referral_rewards')
    .select('referrer_amount')
    .eq('referrer_id', session.user.id)
    .eq('status', 'completed');
    
  if (rewardsError) {
    return { success: false, message: rewardsError.message };
  }
  
  const totalEarned = rewardsData.reduce((sum, item) => sum + (item.referrer_amount || 0), 0);
  
  return { 
    success: true, 
    stats: {
      totalReferrals: count || 0,
      totalEarned
    }
  };
}