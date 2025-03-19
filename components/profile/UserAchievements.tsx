'use client';

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
  // Determine icon for achievement based on type
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
  
  // Generate sample achievements based on stats when no achievements provided
  const generateAchievements = () => {
    const generatedAchievements = [];
    
    if (totalBets && totalBets >= 1) {
      generatedAchievements.push({
        id: 'first_bet',
        type: 'bet_count',
        title: t('profile.achievements_first_bet') || 'First Bet',
        description: t('profile.achievements_first_bet_desc') || 'You placed your first bet'
      });
    }
    
    if (totalBets && totalBets >= 10) {
      generatedAchievements.push({
        id: 'ten_bets',
        type: 'bet_count',
        title: t('profile.achievements_regular') || 'Regular Player',
        description: t('profile.achievements_regular_desc') || 'You placed 10 bets'
      });
    }
    
    if (wonBets && wonBets >= 5) {
      generatedAchievements.push({
        id: 'five_wins',
        type: 'win_streak',
        title: t('profile.achievements_winning') || 'On a Roll',
        description: t('profile.achievements_winning_desc') || 'You won 5 bets'
      });
    }
    
    if (wonBets && totalBets && totalBets > 0 && (wonBets / totalBets) >= 0.5) {
      generatedAchievements.push({
        id: 'accuracy',
        type: 'top_rank',
        title: t('profile.achievements_accuracy') || 'Sharp Eye',
        description: t('profile.achievements_accuracy_desc') || 'You achieved 50%+ accuracy in your predictions'
      });
    }
    
    return generatedAchievements.length > 0 ? generatedAchievements : achievements;
  };
  
  const displayAchievements = achievements.length > 0 ? achievements : generateAchievements();
  
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">{t('leaderboard.score') || 'Points'}</div>
          <div className="text-xl font-medium text-white">{score || 0}</div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">{t('leaderboard.rank') || 'Rank'}</div>
          <div className="text-xl font-medium text-white">#{rank || '-'}</div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">{t('profile.winRate') || 'Win Rate'}</div>
          <div className="text-xl font-medium text-white">
            {totalBets ? Math.round((wonBets || 0) / totalBets * 100) : 0}%
          </div>
        </div>
      </div>
      
      {displayAchievements.length === 0 ? (
        <div className="text-center p-4 text-gray-400">
          <p>{t('profile.noAchievementsYet') || 'No achievements yet'}</p>
          <p className="text-sm mt-2">{t('profile.makeMoreBets') || 'Make more predictions to earn achievements'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayAchievements.map((achievement) => (
            <div key={achievement.id} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="bg-gray-700 p-2 rounded-full text-yellow-400">
                {getAchievementIcon(achievement.type)}
              </div>
              <div>
                <div className="font-medium text-white">{achievement.title}</div>
                <div className="text-sm text-gray-400">{achievement.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}