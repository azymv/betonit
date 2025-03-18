'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Database } from '@/lib/types/supabase';

// Тип для записи лидерборда
export interface LeaderboardEntry {
  user_id: string;
  username?: string | null;
  avatar_url?: string | null;
  rank: number;
  score: number;
  total_bets: number;
  won_bets: number;
  win_rate: number;
}

// Получение глобального лидерборда
export async function getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  const { data, error } = await supabase
    .from('user_stats')
    .select(`
      user_id,
      rank,
      score,
      total_bets,
      won_bets,
      users!inner (
        username,
        avatar_url
      )
    `)
    .order('rank', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  
  return (data || []).map(entry => ({
    user_id: entry.user_id,
    username: entry.users.username,
    avatar_url: entry.users.avatar_url,
    rank: entry.rank || 0,
    score: entry.score || 0,
    total_bets: entry.total_bets || 0,
    won_bets: entry.won_bets || 0,
    win_rate: entry.total_bets > 0 
      ? Math.round((entry.won_bets / entry.total_bets) * 100) 
      : 0
  }));
}

// Получение месячного лидерборда
export async function getMonthlyLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  const { data, error } = await supabase
    .from('user_stats')
    .select(`
      user_id,
      monthly_rank,
      monthly_score,
      total_bets,
      won_bets,
      users!inner (
        username,
        avatar_url
      )
    `)
    .order('monthly_rank', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching monthly leaderboard:', error);
    return [];
  }
  
  return (data || []).map(entry => ({
    user_id: entry.user_id,
    username: entry.users.username,
    avatar_url: entry.users.avatar_url,
    rank: entry.monthly_rank || 0,
    score: entry.monthly_score || 0,
    total_bets: entry.total_bets || 0,
    won_bets: entry.won_bets || 0,
    win_rate: entry.total_bets > 0 
      ? Math.round((entry.won_bets / entry.total_bets) * 100) 
      : 0
  }));
}

// Получение позиции конкретного пользователя
export async function getUserRank(userId: string): Promise<{
  rank: number;
  score: number;
  monthly_rank: number;
  monthly_score: number;
  total_users: number;
} | null> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Получаем статистику пользователя
  const { data: userStats, error: userError } = await supabase
    .from('user_stats')
    .select('rank, score, monthly_rank, monthly_score')
    .eq('user_id', userId)
    .single();
  
  if (userError || !userStats) {
    console.error('Error fetching user rank:', userError);
    return null;
  }
  
  // Получаем общее количество пользователей в лидерборде
  const { count, error: countError } = await supabase
    .from('user_stats')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('Error counting users:', countError);
    return null;
  }
  
  return {
    rank: userStats.rank || 0,
    score: userStats.score || 0,
    monthly_rank: userStats.monthly_rank || 0,
    monthly_score: userStats.monthly_score || 0,
    total_users: count || 0
  };
}

// Обновление рангов (вызываем периодически)
export async function updateLeaderboardRanks(): Promise<boolean> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // Вызываем хранимую процедуру для обновления рангов
    const { error } = await supabase.rpc('update_leaderboard_ranks');
    
    if (error) {
      console.error('Error updating leaderboard ranks:', error);
      return false;
    }
    
    // Обновляем данные на странице лидерборда
    revalidatePath('/leaderboard');
    return true;
  } catch (error) {
    console.error('Exception updating leaderboard ranks:', error);
    return false;
  }
}