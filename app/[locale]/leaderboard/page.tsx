import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getGlobalLeaderboard, getMonthlyLeaderboard, getUserRank } from '@/lib/actions/leaderboard-actions';
import { getTranslation } from '@/lib/i18n-config';
import ClientLeaderboard from './client-page';

export default async function LeaderboardPage({ params }: { params: { locale: string } }) {
  // Get translations for leaderboard keys
  const translations: Record<string, string> = {
    'leaderboard.title': getTranslation(params.locale, 'leaderboard.title'),
    'leaderboard.allTime': getTranslation(params.locale, 'leaderboard.allTime'),
    'leaderboard.monthly': getTranslation(params.locale, 'leaderboard.monthly'),
    'leaderboard.rank': getTranslation(params.locale, 'leaderboard.rank'),
    'leaderboard.user': getTranslation(params.locale, 'leaderboard.user'),
    'leaderboard.score': getTranslation(params.locale, 'leaderboard.score'),
    'leaderboard.bets': getTranslation(params.locale, 'leaderboard.bets'),
    'leaderboard.winRate': getTranslation(params.locale, 'leaderboard.winRate'),
    'leaderboard.noData': getTranslation(params.locale, 'leaderboard.noData'),
    'leaderboard.anonymous': getTranslation(params.locale, 'leaderboard.anonymous'),
    'leaderboard.you': getTranslation(params.locale, 'leaderboard.you'),
    'leaderboard.yourStats': getTranslation(params.locale, 'leaderboard.yourStats'),
    'leaderboard.yourPosition': getTranslation(params.locale, 'leaderboard.yourPosition'),
    'leaderboard.outOf': getTranslation(params.locale, 'leaderboard.outOf'),
    'leaderboard.yourScore': getTranslation(params.locale, 'leaderboard.yourScore'),
    'leaderboard.yourRank': getTranslation(params.locale, 'leaderboard.yourRank'),
    'leaderboard.topPredictors': getTranslation(params.locale, 'leaderboard.topPredictors'),
    'leaderboard.allTimeLeaders': getTranslation(params.locale, 'leaderboard.allTimeLeaders'),
    'leaderboard.monthlyLeaders': getTranslation(params.locale, 'leaderboard.monthlyLeaders'),
    'leaderboard.tableDescription': getTranslation(params.locale, 'leaderboard.tableDescription'),
    'leaderboard.howToEarnPoints': getTranslation(params.locale, 'leaderboard.howToEarnPoints'),
    'leaderboard.points': getTranslation(params.locale, 'leaderboard.points'),
    'leaderboard.rules.placeBets': getTranslation(params.locale, 'leaderboard.rules.placeBets'),
    'leaderboard.rules.placeBetsDescription': getTranslation(params.locale, 'leaderboard.rules.placeBetsDescription'),
    'leaderboard.rules.winBets': getTranslation(params.locale, 'leaderboard.rules.winBets'),
    'leaderboard.rules.winBetsDescription': getTranslation(params.locale, 'leaderboard.rules.winBetsDescription'),
    'leaderboard.rules.referFriends': getTranslation(params.locale, 'leaderboard.rules.referFriends'),
    'leaderboard.rules.referFriendsDescription': getTranslation(params.locale, 'leaderboard.rules.referFriendsDescription'),
    'common.loading': getTranslation(params.locale, 'common.loading'),
  };
  
  // Получаем текущего пользователя
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  // Получаем данные лидерборда
  const allTimeData = await getGlobalLeaderboard(50);
  const monthlyData = await getMonthlyLeaderboard(50);
  
  // Если пользователь авторизован, получаем его ранг
  let userRank = null;
  let userData = null;
  
  if (session?.user) {
    userRank = await getUserRank(session.user.id);
    
    const { data } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', session.user.id)
      .single();
    
    if (data) {
      userData = data;
    }
  }
  
  return (
    <div className="container py-8">
      <ClientLeaderboard
        allTimeData={allTimeData}
        monthlyData={monthlyData}
        currentUserId={session?.user?.id}
        userRank={userRank}
        userData={userData}
        locale={params.locale}
        translations={translations}
      />
    </div>
  );
}