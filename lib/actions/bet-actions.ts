'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types/supabase';
import { processFirstBet } from './referral-actions';

interface PlaceBetParams {
  eventId: string;
  userId: string;
  amount: number;
  prediction: boolean;
}

// Импортируем события из нашего существующего файла

// Функцию trackMixpanelEvent мы не будем использовать, так как 
// у нас уже есть интеграция с Mixpanel через lib/analytics/mixpanel.ts
// На стороне сервера мы будем отслеживать события через API route
// или отложенно в клиентской части

export async function placeBet(params: PlaceBetParams) {
  try {
    const { eventId, userId, amount, prediction } = params;
    
    // Проверяем корректность суммы ставки
    if (amount < 10 || amount > 1000) {
      return { error: 'Сумма ставки должна быть от 10 до 1000 монет' };
    }
    
    const supabase = createServerActionClient<Database>({ cookies });
    
    // Проверяем, существует ли событие и активно ли оно
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('status')
      .eq('id', eventId)
      .single();
    
    if (eventError) {
      console.error('Error fetching event:', eventError);
      return { error: 'Событие не найдено' };
    }
    
    if (event.status !== 'active') {
      return { error: 'Событие не активно, ставки не принимаются' };
    }
    
    // Проверяем баланс пользователя
    const { data: balance, error: balanceError } = await supabase
      .from('balances')
      .select('amount')
      .eq('user_id', userId)
      .eq('currency', 'coins')
      .single();
    
    if (balanceError) {
      console.error('Error fetching balance:', balanceError);
      return { error: 'Не удалось проверить баланс' };
    }
    
    if (!balance || balance.amount < amount) {
      return { error: 'Недостаточно средств для размещения ставки' };
    }
    
    // Проверяем, не делал ли пользователь уже ставку на это событие
    const { data: existingBet, error: betCheckError } = await supabase
      .from('bets')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (betCheckError && betCheckError.code !== 'PGRST116') {
      console.error('Error checking existing bet:', betCheckError);
      return { error: 'Ошибка при проверке существующих ставок' };
    }
    
    if (existingBet) {
      return { error: 'Вы уже сделали ставку на это событие' };
    }
    
    // Начинаем транзакцию для размещения ставки и обновления баланса
    // Фиксированный коэффициент x2.0 для MVP
    const odds = 2.0;
    const potentialPayout = amount * odds;
    
    // 1. Создаем ставку
    const { data: newBet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: userId,
        event_id: eventId,
        amount,
        currency: 'coins',
        prediction,
        odds,
        potential_payout: potentialPayout,
        status: 'active'
      })
      .select()
      .single();
    
    if (betError) {
      console.error('Error creating bet:', betError);
      return { error: 'Не удалось создать ставку' };
    }
    
    // 2. Обновляем баланс пользователя
    const { error: updateBalanceError } = await supabase
      .from('balances')
      .update({ amount: balance.amount - amount })
      .eq('user_id', userId)
      .eq('currency', 'coins');
    
    if (updateBalanceError) {
      console.error('Error updating balance:', updateBalanceError);
      // Если не удалось обновить баланс, удаляем ставку
      await supabase.from('bets').delete().eq('id', newBet.id);
      return { error: 'Не удалось обновить баланс' };
    }
    
    // 3. Создаем транзакцию
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        currency: 'coins',
        type: 'bet_placement',
        reference_id: newBet.id,
        status: 'completed',
        metadata: {
          event_id: eventId,
          prediction
        }
      });
    
    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Не отменяем операцию, так как основная функциональность выполнена
    }

    // 4. НОВОЕ: Проверка на первую ставку и обработка реферальной логики
    const referralResult = await processFirstBet(userId, newBet.id);
    
    if (referralResult.error) {
      console.error('Error processing referral reward:', referralResult.error);
      // Ошибка не критичная, продолжаем
    }
    
    // 5. События для аналитики будут отслеживаться в клиентской части
    // после возврата результата размещения ставки
    // Это лучше всего делать с использованием вашей существующей системы
    
    // Подготовим информацию для аналитики в ответе
    const analyticsData = {
      eventId,
      betId: newBet.id,
      amount,
      prediction: prediction ? 'yes' : 'no',
      isFirstBet: referralResult.isFirstBet || false,
      rewardProcessed: referralResult.rewardProcessed || false
    };
    
    // Если это первая ставка с реферальной наградой, включаем дополнительную информацию
    if (referralResult.isFirstBet && referralResult.rewardProcessed) {
      Object.assign(analyticsData, {
        referrerId: referralResult.referrerId,
        referrerAmount: referralResult.referrerAmount,
        referredAmount: referralResult.referredAmount,
        referrerUsername: referralResult.referrerUsername,
        userUsername: referralResult.userUsername
      });
    }
    
    return { 
      success: true, 
      betId: newBet.id,
      isFirstBet: referralResult.isFirstBet || false,
      rewardProcessed: referralResult.rewardProcessed || false 
    };
  } catch (err) {
    console.error('Error in placeBet:', err);
    return { error: 'Произошла ошибка при размещении ставки' };
  }
}