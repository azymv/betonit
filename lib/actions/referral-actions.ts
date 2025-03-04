'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateReferralCode } from '../utils/referral-utils';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';

interface ReferralInfoResponse {
  referralCode?: string;
  referralLink?: string;
  totalReferrals?: number;
  activeReferrals?: number;
  error: Error | null;
}

/**
 * Получает информацию о рефералах пользователя
 * 
 * @param userId ID пользователя
 * @returns Объект с реферальным кодом и статистикой
 */
export async function getUserReferralInfo(userId: string): Promise<ReferralInfoResponse> {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Получаем реферальный код пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single();
    
    if (userError || !userData?.referral_code) {
      console.error("Error fetching user referral code:", userError);
      return { error: userError || new Error('Referral code not found') };
    }
    
    // Получаем количество приглашенных пользователей
    const { data: referralsData, error: referralsError } = await supabase
      .from('users')
      .select('id, created_at')
      .eq('referred_by', userId);
    
    if (referralsError) {
      console.error("Error fetching referrals count:", referralsError);
      return { error: referralsError };
    }
    
    // Получаем количество активных рефералов (сделавших ставку)
    const { data: activeReferralsData, error: activeError } = await supabase
      .from('users')
      .select('id')
      .eq('referred_by', userId)
      .filter('id', 'in', (supabase.from('bets').select('user_id').limit(1000)));
    
    if (activeError) {
      console.error("Error fetching active referrals:", activeError);
      return { error: activeError };
    }
    
    // Формируем реферальную ссылку
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://betonit-sepia.vercel.app';
    const referralLink = `${baseUrl}/auth/signup?ref=${userData.referral_code}`;
    
    return {
      referralCode: userData.referral_code,
      referralLink,
      totalReferrals: referralsData?.length || 0,
      activeReferrals: activeReferralsData?.length || 0,
      error: null
    };
    
  } catch (error) {
    console.error("Exception in getUserReferralInfo:", error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Создает уникальный реферальный код для пользователя и обновляет запись в базе данных
 * 
 * @param userId ID пользователя
 * @returns Объект с реферальным кодом или ошибкой
 */
export async function createReferralCode(userId: string) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Проверяем, есть ли уже код у пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single();
    
    if (!userError && userData?.referral_code) {
      return { referralCode: userData.referral_code, error: null };
    }
    
    // Генерируем новый код
    const referralCode = generateReferralCode(userId);
    
    // Обновляем запись пользователя
    const { error: updateError } = await supabase
      .from('users')
      .update({ referral_code: referralCode })
      .eq('id', userId);
    
    if (updateError) {
      console.error("Error updating referral code:", updateError);
      return { error: updateError };
    }
    
    return { referralCode, error: null };
  } catch (error) {
    console.error("Exception in createReferralCode:", error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Process first bet for a user and update referral rewards if applicable
 */
export async function processFirstBet(userId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createServerActionClient<Database>({ cookies });
    
    // Check if this is the user's first bet
    const { data: existingBets, error: betsError } = await supabase
      .from('bets')
      .select('id')
      .eq('user_id', userId)
      .limit(2);
    
    if (betsError) {
      console.error("Error checking existing bets:", betsError);
      return { error: betsError };
    }
    
    // If this is not the first bet (there are 2 or more bets), do nothing
    if (existingBets && existingBets.length > 1) {
      return { error: null };
    }
    
    // Get the user's referrer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referred_by')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error("Error fetching user referrer:", userError);
      return { error: userError };
    }
    
    // If user was referred, update referrer's stats
    if (userData?.referred_by) {
      console.log(`Processing first bet for user ${userId} referred by ${userData.referred_by}`);
      
      // Update active referrals count could be done via a trigger or here
      // For now, we'll just log it
      console.log(`User ${userId} made their first bet, referred by ${userData.referred_by}`);
    }
    
    return { error: null };
  } catch (error) {
    console.error("Exception in processFirstBet:", error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}