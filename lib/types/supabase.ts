export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      balances: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          updated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount?: number
          currency?: string
          updated_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          updated_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "balances_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bets: {
        Row: {
          id: string
          user_id: string
          event_id: string
          amount: number
          currency: string
          prediction: boolean
          odds: number
          potential_payout: number
          platform_fee: number
          status: "pending" | "active" | "won" | "lost" | "cancelled"
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          amount: number
          currency?: string
          prediction: boolean
          odds: number
          potential_payout: number
          platform_fee?: number
          status?: "pending" | "active" | "won" | "lost" | "cancelled"
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          amount?: number
          currency?: string
          prediction?: boolean
          odds?: number
          potential_payout?: number
          platform_fee?: number
          status?: "pending" | "active" | "won" | "lost" | "cancelled"
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          short_description: string
          image_url: string | null
          category: string
          start_time: string
          end_time: string
          status: "upcoming" | "active" | "resolved" | "cancelled"
          result: boolean | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          short_description: string
          image_url?: string | null
          category: string
          start_time: string
          end_time: string
          status?: "upcoming" | "active" | "resolved" | "cancelled"
          result?: boolean | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          short_description?: string
          image_url?: string | null
          category?: string
          start_time?: string
          end_time?: string
          status?: "upcoming" | "active" | "resolved" | "cancelled"
          result?: boolean | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          referrer_amount: number
          referred_amount: number
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          referrer_amount?: number
          referred_amount?: number
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          referrer_amount?: number
          referred_amount?: number
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referrer_id_fkey"
            columns: ["referrer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referred_id_fkey"
            columns: ["referred_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          type: "deposit" | "withdrawal" | "bet_placement" | "bet_settlement" | "referral_reward"
          reference_id: string | null
          platform_fee: number | null
          status: string
          metadata: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency?: string
          type: "deposit" | "withdrawal" | "bet_placement" | "bet_settlement" | "referral_reward"
          reference_id?: string | null
          platform_fee?: number | null
          status?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          type?: "deposit" | "withdrawal" | "bet_placement" | "bet_settlement" | "referral_reward"
          reference_id?: string | null
          platform_fee?: number | null
          status?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_stats: {
        Row: {
          user_id: string
          rank: number
          score: number
          monthly_rank: number
          monthly_score: number
          total_bets: number
          won_bets: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          user_id: string
          rank?: number
          score?: number
          monthly_rank?: number
          monthly_score?: number
          total_bets?: number
          won_bets?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          rank?: number
          score?: number
          monthly_rank?: number
          monthly_score?: number
          total_bets?: number
          won_bets?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          email: string
          created_at: string
          updated_at: string | null
          language: string
          referred_by: string | null
          referral_code: string | null
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email: string
          created_at?: string
          updated_at?: string | null
          language?: string
          referred_by?: string | null
          referral_code?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email?: string
          created_at?: string
          updated_at?: string | null
          language?: string
          referred_by?: string | null
          referral_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_referred_by_fkey"
            columns: ["referred_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_coins: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description: string;
        };
        Returns: void;
      };
      update_leaderboard_ranks: {
        Args: Record<string, never>;
        Returns: void;
      };
    }
    Enums: {
      bet_status: "pending" | "active" | "won" | "lost" | "cancelled"
      event_status: "upcoming" | "active" | "resolved" | "cancelled"
      transaction_type: "deposit" | "withdrawal" | "bet_placement" | "bet_settlement" | "referral_reward"
    }
  }
}