'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type UserRankCardProps = {
  username?: string;
  avatarUrl?: string;
  rank: number;
  score: number;
  totalUsers: number;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export default function UserRankCard({
  username,
  avatarUrl,
  rank,
  score,
  totalUsers,
  locale,
  t
}: UserRankCardProps) {
  // Генерирует инициалы из имени пользователя
  const getInitials = (username?: string) => {
    if (!username) return '?';
    return username.substring(0, 2).toUpperCase();
  };
  
  // Форматирует число с разделителями тысяч
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale).format(num);
  };
  
  // Определяет текстовое описание ранга
  const getRankLabel = (rank: number, total: number) => {
    const percentile = (rank / total) * 100;
    
    if (rank === 1) return t('leaderboard.rankLabels.first');
    if (rank <= 3) return t('leaderboard.rankLabels.top3');
    if (rank <= 10) return t('leaderboard.rankLabels.top10');
    if (percentile <= 1) return t('leaderboard.rankLabels.top1percent');
    if (percentile <= 5) return t('leaderboard.rankLabels.top5percent');
    if (percentile <= 10) return t('leaderboard.rankLabels.top10percent');
    if (percentile <= 25) return t('leaderboard.rankLabels.top25percent');
    if (percentile <= 50) return t('leaderboard.rankLabels.top50percent');
    
    return t('leaderboard.rankLabels.other');
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 border">
            <AvatarImage src={avatarUrl || ''} alt={username || 'User'} />
            <AvatarFallback>{getInitials(username)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="font-medium text-lg mb-1">{username || t('leaderboard.yourStats')}</div>
            <div className="text-sm text-muted-foreground">
              {t('leaderboard.yourPosition')}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">{formatNumber(rank)}</div>
            <div className="text-sm text-muted-foreground">
              {t('leaderboard.outOf', { total: formatNumber(totalUsers) })}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">{t('leaderboard.yourScore')}</div>
            <div className="text-xl font-medium">{formatNumber(score)}</div>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">{t('leaderboard.yourRank')}</div>
            <Badge variant="secondary" className="text-xs font-normal">
              {getRankLabel(rank, totalUsers)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}