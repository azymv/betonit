import { Database } from './supabase';

// User type from Supabase
export type User = Database['public']['Tables']['users']['Row'];

// Balance type
export type Balance = Database['public']['Tables']['balances']['Row'];

// Transaction type
export type Transaction = Database['public']['Tables']['transactions']['Row'];

// Transaction type enum
export type TransactionType = Database['public']['Enums']['transaction_type'];

// User profile with additional data
export interface UserProfile extends User {
  balance?: Balance;
  totalBets?: number;
  winRate?: number;
  referralCount?: number;
}

// Type for user settings form
export interface UserSettingsFormData {
  username: string;
  full_name: string;
  language: string;
  email: string;
}

// Type for authentication forms

// Обновим интерфейс AuthFormData, если необходимо
export interface AuthFormData {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
  language?: string;
  termsAccepted?: boolean;
  referralCode?: string;
  confirmPassword?: string;
}