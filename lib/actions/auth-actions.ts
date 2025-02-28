'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types/supabase';

export async function createUserProfile(userId: string, userData: {
  email: string;
  username?: string;
  full_name?: string;
  language?: string;
}) {
  const supabase = createServerActionClient<Database>({ cookies });
  
  // Generate a referral code
  const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  // Create user record in the users table
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: userData.email,
      username: userData.username,
      full_name: userData.full_name,
      language: userData.language || 'en',
      referral_code: referralCode,
    });
  
  if (profileError) {
    console.error('Error creating user profile:', profileError);
    return { error: profileError };
  }
  
  // Create an initial balance for the user
  const { error: balanceError } = await supabase
    .from('balances')
    .insert({
      user_id: userId,
      amount: 1000, // Initial balance of 1000 coins
      currency: 'coins',
    });
  
  if (balanceError) {
    console.error('Error creating initial balance:', balanceError);
    return { error: balanceError };
  }
  
  return { error: null };
}