'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types/supabase';

export async function createUserProfile(userId: string, userData: {
  email: string;
  username?: string;
  full_name?: string;
  language?: string;
}) {
  console.log("Starting createUserProfile for user:", userId);
  
  try {
    // First try regular client
    const supabase = createServerActionClient<Database>({ cookies });
    
    // Check if user already exists (to avoid duplicate entries)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking if user exists:', checkError);
    }
    
    if (existingUser) {
      console.log('User profile already exists, skipping creation');
      return { error: null };
    }
    
    console.log('User does not exist yet, creating profile');
    
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
    }
    
    // Generate a referral code
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Create user record in the users table
    const { error: profileError } = await client
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
    
    console.log("User profile created, creating initial balance");
    
    // Create an initial balance for the user
    const { error: balanceError } = await client
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
    
    console.log("User setup completed successfully");
    return { error: null };
  } catch (error) {
    console.error('Exception in createUserProfile:', error);
    return { error: error as Error };
  }
}