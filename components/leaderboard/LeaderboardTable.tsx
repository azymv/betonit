'use client';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LeaderboardEntry } from '@/lib/actions/leaderboard-actions';

type LeaderboardTableProps = {
  data: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export default function LeaderboardTable({ 
  data, 
  currentUserId, 
  isLoading = false,
  locale,
  t
}: LeaderboardTableProps) {
  // Генерирует инициалы из имени пользователя
  const getInitials = (username?: string | null) => {
    if (!username) return '?';
    return username.substring(0, 2).toUpperCase();
  };
  
  // Форматирует число с разделителями тысяч
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale).format(num);
  };
  
  return (
    <div className="relative overflow-x-auto rounded-md border">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex justify-center items-center z-10">
          <div className="animate-pulse text-primary">{t('common.loading')}</div>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">{t('leaderboard.rank')}</TableHead>
            <TableHead>{t('leaderboard.user')}</TableHead>
            <TableHead className="text-right">{t('leaderboard.score')}</TableHead>
            <TableHead className="text-right hidden md:table-cell">{t('leaderboard.bets')}</TableHead>
            <TableHead className="text-right hidden md:table-cell">{t('leaderboard.winRate')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                {t('leaderboard.noData')}
              </TableCell>
            </TableRow>
          ) : (
            data.map((entry) => (
              <TableRow 
                key={entry.user_id}
                className={currentUserId === entry.user_id ? 'bg-primary/5' : ''}
              >
                <TableCell className="text-center font-medium">
                  {entry.rank <= 3 ? (
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/30 text-primary font-bold">
                      {entry.rank}
                    </div>
                  ) : (
                    entry.rank
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 border">
                      <AvatarImage src={entry.avatar_url || ''} alt={entry.username || 'User'} />
                      <AvatarFallback>{getInitials(entry.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {entry.username || t('leaderboard.anonymous')}
                        {currentUserId === entry.user_id && (
                          <Badge variant="outline" className="text-xs py-0">
                            {t('leaderboard.you')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(entry.score)}
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  {formatNumber(entry.total_bets)}
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <div className="inline-flex items-center gap-1.5">
                    <span 
                      className={`inline-block w-2 h-2 rounded-full ${
                        entry.win_rate >= 50 ? 'bg-green-500' : 
                        entry.win_rate >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                    {entry.win_rate}%
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}