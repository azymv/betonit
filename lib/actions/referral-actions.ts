'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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
 * Генерирует уникальный реферальный код
 * 
 * @param userId ID пользователя для создания более уникального кода
 * @param length Длина кода (по умолчанию 8 символов)
 * @returns Уникальный реферальный код
 */
export function generateReferralCode(userId: string, length: number = 8): string {
  // Используем первые 4 символа ID пользователя как основу
  const userIdBase = userId.substring(0, 4);
  
  // Добавляем случайные символы для уникальности
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = userIdBase;
  
  // Добавляем случайные символы до достижения нужной длины
  const remainingLength = Math.max(0, length - userIdBase.length);
  for (let i = 0; i < remainingLength; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
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
    // Сначала получаем всех рефералов
    const referredUserIds = referralsData?.map(user => user.id) || [];
    
    // Если нет рефералов, то и активных рефералов нет
    let activeReferralsCount = 0;
    
    if (referredUserIds.length > 0) {
      // Затем проверяем, кто из них сделал ставки
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('user_id')
        .in('user_id', referredUserIds);
      
      if (betsError) {
        console.error("Error fetching bets for referrals:", betsError);
        return { error: betsError };
      }
      
      // Получаем уникальные ID пользователей, сделавших ставки
      const activeUserIds = [...new Set(betsData?.map(bet => bet.user_id))];
      activeReferralsCount = activeUserIds.length;
    }
    
    // Формируем реферальную ссылку
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://betonit-sepia.vercel.app';
    const referralLink = `${baseUrl}/auth/signup?ref=${userData.referral_code}`;
    
    return {
      referralCode: userData.referral_code,
      referralLink,
      totalReferrals: referralsData?.length || 0,
      activeReferrals: activeReferralsCount,
      error: null
    };
    
  } catch (error) {
    console.error("Exception in getUserReferralInfo:", error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Process first bet for a user and update referral rewards if applicable
 */
export async function processFirstBet(userId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createServerActionClient<Database>({ cookies });
    
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
      // For now, we'll just log it
    }
    
    return { error: null };
  } catch (error) {
    console.error("Exception in processFirstBet:", error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}