'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Medal, Star } from 'lucide-react';

type UserAchievementsProps = {
  rank?: number;
  score?: number;
  totalBets?: number;
  wonBets?: number;
  achievements?: {
    id: string;
    type: string;
    title: string;
    description: string;
  }[];
  t: (key: string) => string;
};

export default function UserAchievements({
  rank,
  score,
  totalBets,
  wonBets,
  achievements = [],
  t
}: UserAchievementsProps) {
  // Определяет иконку для достижения по его типу
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'bet_count':
        return <Trophy className="h-4 w-4" />;
      case 'win_streak':
        return <Star className="h-4 w-4" />;
      case 'top_rank':
        return <Award className="h-4 w-4" />;
      default:
        return <Medal className="h-4 w-4" />;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.achievements')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">{t('leaderboard.score')}</div>
            <div className="text-2xl font-medium">{score || 0}</div>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">{t('leaderboard.rank')}</div>
            <div className="text-2xl font-medium">#{rank || '-'}</div>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">{t('profile.winRate')}</div>
            <div className="text-2xl font-medium">
              {totalBets ? Math.round((wonBets || 0) / totalBets * 100) : 0}%
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-medium mb-4">{t('profile.yourAchievements')}</h3>
        
        {achievements.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            <p>{t('profile.noAchievementsYet')}</p>
            <p className="text-sm mt-2">{t('profile.makeMoreBets')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  {getAchievementIcon(achievement.type)}
                </div>
                <div>
                  <div className="font-medium">{achievement.title}</div>
                  <div className="text-sm text-muted-foreground">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}