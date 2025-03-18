'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type LeaderboardFiltersProps = {
  activeTab: 'all' | 'monthly';
  onTabChange: (tab: 'all' | 'monthly') => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export default function LeaderboardFilters({
  activeTab,
  onTabChange,
  t
}: LeaderboardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <h2 className="text-2xl font-bold">{t('leaderboard.title')}</h2>
      
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'all' | 'monthly')}>
        <TabsList>
          <TabsTrigger value="all">{t('leaderboard.allTime')}</TabsTrigger>
          <TabsTrigger value="monthly">{t('leaderboard.monthly')}</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}