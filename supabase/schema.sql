-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create custom types
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'bet_placement', 'bet_settlement');
CREATE TYPE event_status AS ENUM ('upcoming', 'active', 'resolved', 'cancelled');
CREATE TYPE bet_status AS ENUM ('pending', 'active', 'won', 'lost', 'cancelled');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  language TEXT DEFAULT 'en' NOT NULL,
  referred_by UUID REFERENCES auth.users,
  referral_code TEXT UNIQUE,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Create balances table
CREATE TABLE public.balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users NOT NULL,
  amount DECIMAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'coins',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, currency)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'coins',
  type transaction_type NOT NULL,
  reference_id UUID,
  platform_fee DECIMAL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status event_status NOT NULL DEFAULT 'upcoming',
  result BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bets table
CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users NOT NULL,
  event_id UUID REFERENCES public.events NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'coins',
  prediction BOOLEAN NOT NULL,
  odds DECIMAL NOT NULL,
  potential_payout DECIMAL NOT NULL,
  platform_fee DECIMAL NOT NULL DEFAULT 0,
  status bet_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT min_bet_amount CHECK (amount >= 10),
  CONSTRAINT max_bet_amount CHECK (amount <= 1000)
);

-- Create referral rewards table
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.users NOT NULL,
  referred_id UUID REFERENCES public.users NOT NULL,
  referrer_amount DECIMAL NOT NULL DEFAULT 100,
  referred_amount DECIMAL NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Setup Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own balances" 
  ON public.balances FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" 
  ON public.transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view events" 
  ON public.events FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can insert/update/delete events" 
  ON public.events USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own bets" 
  ON public.bets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bets" 
  ON public.bets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own referral rewards" 
  ON public.referral_rewards FOR SELECT 
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Create stored procedure for placing bets
CREATE OR REPLACE FUNCTION place_bet(
  p_event_id UUID,
  p_user_id UUID,
  p_amount DECIMAL,
  p_prediction BOOLEAN
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bet_id UUID;
  v_event_status event_status;
  v_user_balance DECIMAL;
  v_odds DECIMAL;
  v_potential_payout DECIMAL;
BEGIN
  -- Check if event exists and is active
  SELECT status INTO v_event_status FROM public.events WHERE id = p_event_id;
  IF NOT FOUND OR v_event_status != 'active' THEN
    RAISE EXCEPTION 'Event not found or not active';
  END IF;
  
  -- Get user's balance
  SELECT amount INTO v_user_balance FROM public.balances 
  WHERE user_id = p_user_id AND currency = 'coins';
  
  IF NOT FOUND OR v_user_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- В MVP используем фиксированные коэффициенты 1:1, как указано в PRD
  -- Выигрыш = ставка x 2 (возврат ставки + выигрыш)
  v_odds := 2.0;
  v_potential_payout := p_amount * v_odds;
  
  -- Start transaction
  BEGIN
    -- Insert bet
    INSERT INTO public.bets (
      user_id, event_id, amount, currency, prediction, odds, potential_payout, status
    ) VALUES (
      p_user_id, p_event_id, p_amount, 'coins', p_prediction, v_odds, v_potential_payout, 'active'
    ) RETURNING id INTO v_bet_id;
    
    -- Update user balance
    UPDATE public.balances 
    SET amount = amount - p_amount
    WHERE user_id = p_user_id AND currency = 'coins';
    
    -- Record transaction
    INSERT INTO public.transactions (
      user_id, amount, currency, type, reference_id, status
    ) VALUES (
      p_user_id, -p_amount, 'coins', 'bet_placement', v_bet_id, 'completed'
    );
    
    -- Commit is automatic if no exceptions
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error placing bet: %', SQLERRM;
  END;
  
  RETURN v_bet_id;
END;
$$;

-- Create function to resolve events and settle bets
CREATE OR REPLACE FUNCTION resolve_event(
  p_event_id UUID,
  p_result BOOLEAN
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bet RECORD;
  v_platform_fee DECIMAL;
BEGIN
  -- Update event status
  UPDATE public.events 
  SET status = 'resolved', result = p_result, updated_at = now()
  WHERE id = p_event_id;
  
  -- Process all bets for this event
  FOR v_bet IN 
    SELECT * FROM public.bets WHERE event_id = p_event_id AND status = 'active'
  LOOP
    -- If bet prediction matches result, it's a win
    IF v_bet.prediction = p_result THEN
      -- Update bet status
      UPDATE public.bets SET status = 'won', updated_at = now()
      WHERE id = v_bet.id;
      
      -- Calculate platform fee (5% согласно PRD)
      v_platform_fee := v_bet.potential_payout * 0.05;
      
      -- Update user balance with winnings minus platform fee
      UPDATE public.balances 
      SET amount = amount + (v_bet.potential_payout - v_platform_fee)
      WHERE user_id = v_bet.user_id AND currency = 'coins';
      
      -- Record transaction with platform fee
      INSERT INTO public.transactions (
        user_id, amount, currency, type, reference_id, platform_fee, status
      ) VALUES (
        v_bet.user_id, 
        (v_bet.potential_payout - v_platform_fee),
        'coins', 
        'bet_settlement', 
        v_bet.id,
        v_platform_fee,
        'completed'
      );
    ELSE
      -- Update bet status to lost
      UPDATE public.bets SET status = 'lost',