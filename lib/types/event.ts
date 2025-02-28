import { Database } from './supabase';

// Event type from Supabase
export type Event = Database['public']['Tables']['events']['Row'];

// Event status enum
export type EventStatus = Database['public']['Enums']['event_status'];

// Event with additional data
export interface EventWithStats extends Event {
  yesBetCount?: number;
  noBetCount?: number;
  totalBetAmount?: number;
  yesBetPercentage?: number;  // Percentage of "Yes" bets (0-100)
  noBetPercentage?: number;   // Percentage of "No" bets (0-100)
  userBet?: Bet | null;       // Current user's bet on this event, if any
}

// Event filter options
export interface EventFilters {
  category?: string;
  status?: EventStatus;
  searchQuery?: string;
  sortBy?: 'end_time' | 'start_time' | 'popularity';
  sortDirection?: 'asc' | 'desc';
}

// Bet type from Supabase
export type Bet = Database['public']['Tables']['bets']['Row'];

// Bet status enum
export type BetStatus = Database['public']['Enums']['bet_status'];

// Betting form data
export interface BetFormData {
  eventId: string;
  prediction: boolean;
  amount: number;
}

// Event categories
export const EVENT_CATEGORIES = [
  'politics',
  'cryptocurrency',
  'economy',
  'technology',
  'sports',
  'entertainment',
  'science',
  'other'
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];