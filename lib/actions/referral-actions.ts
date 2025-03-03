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