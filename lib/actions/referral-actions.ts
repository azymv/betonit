'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateReferralCode } from '../utils/referral-utils';

interface ReferralInfoResponse {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
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
    console.log('getUserReferralInfo called for user:', userId);
    const supabase = createServerComponentClient({ cookies });
    
    // Получаем реферальный код пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single();
    
    console.log('User data query result:', userData, 'Error:', userError);
    
    let referralCode = userData?.referral_code || '';
    
    if (userError) {
      console.error("Error fetching user referral code:", userError);
      return { 
        referralCode: '',
        referralLink: '',
        totalReferrals: 0,
        activeReferrals: 0,
        error: userError
      };
    }
    
    if (!referralCode) {
      console.log('No referral code found, generating one...');
      // Если код не найден, генерируем его
      referralCode = generateReferralCode(userId);
      
      // Обновляем запись пользователя
      const { error: updateError } = await supabase
        .from('users')
        .update({ referral_code: referralCode })
        .eq('id', userId);
      
      if (updateError) {
        console.error("Error updating referral code:", updateError);
        return { 
          referralCode: '',
          referralLink: '',
          totalReferrals: 0,
          activeReferrals: 0,
          error: updateError
        };
      }
    }
    
    // Формируем реферальную ссылку (используем en как язык по умолчанию для MVP)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://betonit-sepia.vercel.app';
    const referralLink = `${baseUrl}/en/auth/signup?ref=${referralCode}`;
    console.log('Generated referral link:', referralLink);
    
    // Для MVP версии упрощаем запросы на получение статистики
    let totalReferrals = 0;
    const activeReferrals = 0;
    
    try {
      // Получаем количество приглашенных пользователей
      const { data: referralsData } = await supabase
        .from('users')
        .select('id')
        .eq('referred_by', userId);
      
      totalReferrals = referralsData?.length || 0;
    } catch (err) {
      console.error('Error fetching referrals count:', err);
      // Продолжаем выполнение, не выбрасывая ошибку
    }
    
    return {
      referralCode,
      referralLink,
      totalReferrals,
      activeReferrals,
      error: null
    };
    
  } catch (error) {
    console.error("Exception in getUserReferralInfo:", error);
    return { 
      referralCode: '',
      referralLink: '',
      totalReferrals: 0,
      activeReferrals: 0,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}