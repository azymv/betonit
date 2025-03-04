'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateReferralLink } from '@/lib/utils/referral-utils';

// Константы для реферальной программы
const REFERRER_REWARD = 100;  // Награда для пригласившего
const REFERRED_REWARD = 50;   // Награда для приглашенного

/**
 * Получает информацию о рефералах пользователя
 * 
 * @param userId ID пользователя
 * @returns Объект с реферальной ссылкой и статистикой
 */
export async function getUserReferralInfo(userId: string) {
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
    
    // Генерируем полную реферальную ссылку
    const referralLink = generateReferralLink(userData.referral_code);
    
    // Получаем количество приглашенных пользователей
    const { data: referralsData, error: referralsError } = await supabase
      .from('users')
      .select('id')
      .eq('referred_by', userId);
    
    if (referralsError) {
      console.error("Error fetching referrals count:", referralsError);
      return { error: referralsError };
    }
    
    // Получаем количество активных рефералов (сделавших ставку)
    const { data: activeReferralsData, error: activeError } = await supabase
      .from('referral_rewards')
      .select('id')
      .eq('referrer_id', userId)
      .eq('status', 'completed');
    
    if (activeError) {
      console.error("Error fetching active referrals:", activeError);
      return { error: activeError };
    }
    
    // Получаем сумму заработанных монет
    const { data: earningsData, error: earningsError } = await supabase
      .from('referral_rewards')
      .select('referrer_amount')
      .eq('referrer_id', userId)
      .eq('status', 'completed');
    
    if (earningsError) {
      console.error("Error fetching referral earnings:", earningsError);
      return { error: earningsError };
    }
    
    // Рассчитываем сумму заработанных монет
    const totalEarned = earningsData.reduce((sum, item) => sum + item.referrer_amount, 0);
    
    return {
      referralLink,
      referralCode: userData.referral_code,
      totalReferrals: referralsData.length || 0,
      activeReferrals: activeReferralsData.length || 0,
      totalEarned,
      error: null
    };
    
  } catch (error) {
    console.error("Exception in getUserReferralInfo:", error);
    return { error };
  }
}

/**
 * Проверяет, является ли ставка первой для пользователя, и при необходимости
 * начисляет реферальные бонусы
 * 
 * @param userId ID пользователя, сделавшего ставку
 * @param betId ID ставки
 */
export async function processFirstBet(userId: string, betId: string) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Проверяем, первая ли это ставка
    const { data: previousBets, error: betsError } = await supabase
      .from('bets')
      .select('id')
      .eq('user_id', userId)
      .neq('id', betId) // Исключаем текущую ставку
      .limit(1);
    
    if (betsError) {
      console.error("Error checking previous bets:", betsError);
      return { error: betsError };
    }
    
    // Если есть предыдущие ставки, это не первая ставка
    if (previousBets && previousBets.length > 0) {
      return { isFirstBet: false, error: null };
    }
    
    // Получаем данные пользователя для аналитики
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error("Error fetching user data:", userError);
    }
    
    // Отправляем событие первой ставки в аналитику
    // Это происходит в серверном действии, поэтому нужно использовать fetch напрямую
    // В реальном приложении нужно создать соответствующий API endpoint
    
    // Проверяем, есть ли ожидающие реферальные вознаграждения
    const { data: pendingRewards, error: rewardsError } = await supabase
      .from('referral_rewards')
      .select('id, referrer_id')
      .eq('referred_id', userId)
      .eq('status', 'pending')
      .limit(1);
    
    if (rewardsError) {
      console.error("Error checking pending rewards:", rewardsError);
      return { error: rewardsError };
    }
    
    // Если нет ожидающих вознаграждений, выходим
    if (!pendingRewards || pendingRewards.length === 0) {
      return { isFirstBet: true, rewardProcessed: false, error: null };
    }
    
    // Получаем ID реферера
    const referrerId = pendingRewards[0].referrer_id;
    const rewardId = pendingRewards[0].id;
    
    // Получаем данные реферера для аналитики
    const { data: referrerData, error: referrerUserError } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', referrerId)
      .single();
      
    if (referrerUserError) {
      console.error("Error fetching referrer data:", referrerUserError);
    }
    
    // Начисляем вознаграждение пригласившему
    const { error: referrerError } = await supabase.rpc('add_coins', {
      p_user_id: referrerId,
      p_amount: REFERRER_REWARD,
      p_description: `Referral reward for inviting a user who made their first bet`
    });
    
    if (referrerError) {
      console.error("Error crediting referrer:", referrerError);
      return { error: referrerError };
    }
    
    // Начисляем вознаграждение приглашенному
    const { error: referredError } = await supabase.rpc('add_coins', {
      p_user_id: userId,
      p_amount: REFERRED_REWARD,
      p_description: `Welcome bonus for making your first bet`
    });
    
    if (referredError) {
      console.error("Error crediting referred user:", referredError);
      return { error: referredError };
    }
    
    // Обновляем статус вознаграждения
    const { error: updateError } = await supabase
      .from('referral_rewards')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', rewardId);
    
    if (updateError) {
      console.error("Error updating reward status:", updateError);
      return { error: updateError };
    }
    
    return { 
      isFirstBet: true, 
      rewardProcessed: true, 
      referrerId,
      referrerAmount: REFERRER_REWARD,
      referredAmount: REFERRED_REWARD,
      referrerUsername: referrerData?.username,
      userUsername: userData?.username,
      error: null 
    };
    
  } catch (error) {
    console.error("Exception in processFirstBet:", error);
    return { error };
  }
}

/**
 * Получает список приглашенных пользователей
 * 
 * @param userId ID пользователя
 * @returns Список приглашенных пользователей с их статусом
 */
export async function getUserReferrals(userId: string) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Получаем список приглашенных пользователей с их статусом
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        full_name,
        created_at,
        referral_rewards!inner (
          status,
          referrer_amount,
          created_at,
          updated_at
        )
      `)
      .eq('referred_by', userId)
      .eq('referral_rewards.referrer_id', userId);
    
    if (error) {
      console.error("Error fetching user referrals:", error);
      return { error };
    }
    
    return { referrals: data || [], error: null };
    
  } catch (error) {
    console.error("Exception in getUserReferrals:", error);
    return { error };
  }
}

/**
 * SQL функции, которые нужно создать в Supabase:
 * 
 * CREATE OR REPLACE FUNCTION add_coins(
 *   p_user_id UUID,
 *   p_amount NUMERIC,
 *   p_description TEXT
 * ) RETURNS VOID AS $$
 * DECLARE
 *   v_balance_id UUID;
 * BEGIN
 *   -- Получаем ID записи баланса
 *   SELECT id INTO v_balance_id
 *   FROM balances
 *   WHERE user_id = p_user_id AND currency = 'coins';
 *   
 *   -- Если записи нет, создаем
 *   IF v_balance_id IS NULL THEN
 *     INSERT INTO balances (user_id, amount, currency)
 *     VALUES (p_user_id, p_amount, 'coins')
 *     RETURNING id INTO v_balance_id;
 *   ELSE
 *     -- Обновляем существующий баланс
 *     UPDATE balances
 *     SET amount = amount + p_amount, updated_at = NOW()
 *     WHERE id = v_balance_id;
 *   END IF;
 *   
 *   -- Создаем запись в транзакциях
 *   INSERT INTO transactions (
 *     user_id,
 *     amount,
 *     currency,
 *     type,
 *     description
 *   ) VALUES (
 *     p_user_id,
 *     p_amount,
 *     'coins',
 *     'referral',
 *     p_description
 *   );
 * END;
 * $$ LANGUAGE plpgsql;
 */