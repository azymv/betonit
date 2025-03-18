'use client';

import { useState } from 'react';
import { LeaderboardEntry } from '@/lib/actions/leaderboard-actions';
import LeaderboardFilters from '@/components/leaderboard/LeaderboardFilters';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import UserRankCard from '@/components/leaderboard/UserRankCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface ClientLeaderboardProps {
  allTimeData: LeaderboardEntry[];
  monthlyData: LeaderboardEntry[];
  currentUserId?: string;
  userRank?: {
    rank: number;
    score: number;
    monthly_rank: number;
    monthly_score: number;
    total_users: number;
  } | null;
  userData?: {
    username?: string;
    avatar_url?: string;
  } | null;
  locale: string;
  translations: Record<string, string>;
}

export default function ClientLeaderboard({
  allTimeData,
  monthlyData,
  currentUserId,
  userRank,
  userData,
  locale,
  translations
}: ClientLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'monthly'>('all');
  
  const currentData = activeTab === 'all' ? allTimeData : monthlyData;
  
  // Helper translation function that uses the translations record
  const t = (key: string) => translations[key] || key;
  
  return (
    <div className="space-y-6">
      <LeaderboardFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        t={t}
      />
      
      {userRank && (
        <UserRankCard
          username={userData?.username}
          avatarUrl={userData?.avatar_url}
          rank={activeTab === 'all' ? userRank.rank : userRank.monthly_rank}
          score={activeTab === 'all' ? userRank.score : userRank.monthly_score}
          totalUsers={userRank.total_users}
          locale={locale}
          t={t}
        />
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between">
            <CardTitle>{t('leaderboard.topPredictors')}</CardTitle>
            <div className="text-muted-foreground text-sm">
              {activeTab === 'all' 
                ? t('leaderboard.allTimeLeaders') 
                : t('leaderboard.monthlyLeaders')}
            </div>
          </div>
          <CardDescription>
            {t('leaderboard.tableDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaderboardTable 
            data={currentData} 
            currentUserId={currentUserId}
            locale={locale}
            t={t}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {t('leaderboard.howToEarnPoints')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/5 p-4 rounded-lg space-y-2">
              <div className="font-medium">{t('leaderboard.rules.placeBets')}</div>
              <p className="text-sm text-muted-foreground">
                {t('leaderboard.rules.placeBetsDescription')}
              </p>
              <div className="text-primary font-medium">+10 {t('leaderboard.points')}</div>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-lg space-y-2">
              <div className="font-medium">{t('leaderboard.rules.winBets')}</div>
              <p className="text-sm text-muted-foreground">
                {t('leaderboard.rules.winBetsDescription')}
              </p>
              <div className="text-primary font-medium">+20 {t('leaderboard.points')}</div>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-lg space-y-2">
              <div className="font-medium">{t('leaderboard.rules.referFriends')}</div>
              <p className="text-sm text-muted-foreground">
                {t('leaderboard.rules.referFriendsDescription')}
              </p>
              <div className="text-primary font-medium">+50 {t('leaderboard.points')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}