'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n-config';
import { useAuth } from '@/lib/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { BarChart3, Trophy, Coins, ListTodo, Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { getUserRank } from '@/lib/actions/leaderboard-actions';
import { Button } from '@/components/ui/button';

// Types from the database
type Bet = Database['public']['Tables']['bets']['Row'];

// Bet with event information
interface BetWithEvent extends Bet {
  events?: {
    title: string;
    status: string;
    result: boolean | null;
  };
}

// Stats interface
interface BetStatistics {
  total: number;
  won: number;
  lost: number;
  winRate: number;
}

export default function DashboardPage() {
  const params = useParams();
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  const { t } = useTranslation(localeStr);
  const { user } = useAuth();
  
  // Create Supabase client
  const supabase = createClientComponentClient<Database>();
  
  // State
  const [balance, setBalance] = useState(0);
  const [userBets, setUserBets] = useState<BetWithEvent[]>([]);
  const [betStats, setBetStats] = useState<BetStatistics>({ total: 0, won: 0, lost: 0, winRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<{ rank: number; score: number; } | null>(null);
  
  // Calculate bet statistics
  const calculateBetStats = (bets: BetWithEvent[]): BetStatistics => {
    const total = bets.length;
    const won = bets.filter(bet => bet.status === 'won').length;
    const lost = bets.filter(bet => bet.status === 'lost').length;
    const winRate = total > 0 ? (won / total) * 100 : 0;
    
    return { total, won, lost, winRate };
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      localeStr === 'ru' ? 'ru-RU' : 'en-US', 
      { day: 'numeric', month: 'short', year: 'numeric' }
    );
  };
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(localeStr === 'en' ? 'en-US' : 'ru-RU').format(num);
  };
  
  // Get appropriate badge for bet status
  const getBetStatusBadge = (bet: BetWithEvent) => {
    switch (bet.status) {
      case 'won':
        return <Badge className="bg-secondary hover:bg-secondary/90 text-black"><CheckCircle2 className="h-3 w-3 mr-1" /> {t("profile.stats.won") || "Won"}</Badge>;
      case 'lost':
        return <Badge className="bg-red-600 hover:bg-red-700 text-white"><XCircle className="h-3 w-3 mr-1" /> {t("profile.stats.lost") || "Lost"}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white"><Clock className="h-3 w-3 mr-1" /> {t("profile.pending") || "Pending"}</Badge>;
      default:
        return null;
    }
  };
  
  // Get rank label based on rank
  const getRankLabel = (rank?: number) => {
    if (!rank) return '';
    
    if (rank === 1) return t('leaderboard.rankLabels.first') || 'Champion';
    if (rank <= 3) return t('leaderboard.rankLabels.top3') || 'Top 3';
    if (rank <= 10) return t('leaderboard.rankLabels.top10') || 'Top 10';
    if (rank <= 100) return t('leaderboard.rankLabels.top1percent') || 'Top 1%';
    if (rank <= 500) return t('leaderboard.rankLabels.top5percent') || 'Top 5%';
    
    return `#${rank}`;
  };

  // Get colored badge for prediction
  const getPredictionBadge = (prediction: boolean) => {
    if (prediction) {
      return <Badge className="bg-secondary hover:bg-secondary/90 text-black">{t("common.yes") || "Yes"}</Badge>;
    } else {
      return <Badge className="bg-purple-600 hover:bg-purple-700 text-white">{t("common.no") || "No"}</Badge>;
    }
  };
  
  // Load user data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Fetch balance
        const { data: balanceData, error: balanceError } = await supabase
          .from('balances')
          .select('amount')
          .eq('user_id', user.id)
          .eq('currency', 'coins')
          .single();
        
        if (balanceError) {
          console.error('Error loading balance:', balanceError);
        } else if (balanceData) {
          setBalance(balanceData.amount);
        }
        
        // Fetch bets
        const { data: betsData, error: betsError } = await supabase
          .from('bets')
          .select(`
            *,
            events (
              title,
              status,
              result
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (betsError) {
          console.error('Error loading bets:', betsError);
        } else if (betsData) {
          setUserBets(betsData as BetWithEvent[]);
          const stats = calculateBetStats(betsData as BetWithEvent[]);
          setBetStats(stats);
        }
        
        // Fetch user rank
        const rankData = await getUserRank(user.id);
        if (rankData) {
          setUserRank({
            rank: rankData.rank,
            score: rankData.score
          });
        }
      } catch (err) {
        console.error('Exception loading profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfileData();
  }, [user, supabase, localeStr]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">{t("profile.dashboard") || "Dashboard"}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-900 text-white border-gray-800">
              <CardContent className="p-6">
                <div className="h-28 bg-gray-800 animate-pulse rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold text-white">{t("profile.dashboard") || "My Dashboard"}</h1>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance */}
        <Card className="bg-gray-900 text-white border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Coins className="h-5 w-5 mr-2 text-yellow-400" />
              {t("profile.balance") || "Balance"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{formatNumber(balance)}</div>
          </CardContent>
        </Card>
        
        {/* Betting Stats */}
        <Card className="bg-gray-900 text-white border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              {t("profile.stats.title") || "Betting Stats"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold">{betStats.winRate.toFixed(0)}%</div>
                <p className="text-gray-400 text-sm">{t("profile.winRate") || "Win Rate"}</p>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">{betStats.won} {t("profile.stats.won") || "Won"}</div>
                <div className="font-bold text-white">{betStats.lost} {t("profile.stats.lost") || "Lost"}</div>
                <div className="text-gray-400">{betStats.total} {t("profile.stats.total") || "Total"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Leaderboard Position */}
        <Card className="bg-gray-900 text-white border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
              {t("profile.rating") || "Rating"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              <Badge className="bg-secondary hover:bg-secondary/90 text-black mr-2">
                {getRankLabel(userRank?.rank)}
              </Badge>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {userRank ? 
                `${t("leaderboard.yourPosition") || "Your position"}: ${userRank.rank} ${t("leaderboard.outOf", { total: "1000+" }) || "out of 1000+"}` :
                t("profile.not_ranked") || "You don't have a rating yet"
              }
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* My Bets */}
      <Card className="bg-gray-900 text-white border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-lg flex items-center">
            <ListTodo className="h-5 w-5 mr-2 text-primary" />
            {t("profile.myBets") || "My Bets"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {userBets.length > 0 ? (
            <div className="space-y-4">
              {userBets.map((bet) => (
                <div key={bet.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-800 last:border-0 gap-3">
                  <div>
                    <div className="font-medium text-white">{bet.events?.title || ""}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-400">
                        {t("events.yourBet") || "Your bet"}: {getPredictionBadge(bet.prediction)}
                      </span>
                      <span className="text-sm text-gray-400">
                        • {formatDate(bet.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="text-right">
                      <div className="font-medium text-white">
                        {formatNumber(bet.amount)} {t("common.coins") || "coins"}
                      </div>
                      <div className="text-sm text-gray-400">
                        {t("events.potentialWinnings") || "Potential winnings"}: {formatNumber(bet.potential_payout || 0)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {getBetStatusBadge(bet)}
                      <Button 
                        asChild 
                        variant="outline" 
                        size="sm" 
                        className="border-gray-700 bg-gray-800 text-primary hover:bg-gray-700"
                      >
                        <Link href={`/${localeStr}/events/${bet.event_id}`}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {t("profile.viewEvent") || "View event"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              {t("profile.noBets") || "You haven't placed any bets yet"}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Achievements section - hidden for now 
      <Card className="bg-gray-900 text-white border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-lg flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
            {t("profile.achievements") || "Achievements"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <UserAchievements 
            rank={userRank?.rank}
            score={userRank?.score}
            totalBets={betStats.total}
            wonBets={betStats.won}
            t={t}
          />
        </CardContent>
      </Card>
      */}
    </div>
  );
}