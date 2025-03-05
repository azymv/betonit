'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getUserReferralInfo } from '@/lib/actions/referral-actions'; 
import { Loader2, Copy, Check, Users, User, AlertCircle } from 'lucide-react';
import { track } from '@/lib/analytics/mixpanel';

interface ReferralTabProps {
  userId: string;
  locale: string;
}

export function ReferralTab({ userId, locale }: ReferralTabProps) {
  const { t } = useTranslation(locale);
  const [referralInfo, setReferralInfo] = useState<{
    referralCode: string;
    referralLink: string;
    totalReferrals: number;
    activeReferrals: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const loadingRef = useRef(false);
  
  // Базовая функция для генерации ссылки на клиенте (резервный вариант)
  const generateLocalReferralLink = (code: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${locale}/auth/signup?ref=${code}`;
  };
  
  // Загружаем информацию о рефералах
  useEffect(() => {
    const loadReferralInfo = async () => {
      // Если уже загружаем или загрузили, не делаем ничего
      if (loadingRef.current) return;
      
      loadingRef.current = true;
      try {
        console.log('Starting to load referral info for user:', userId);
        setLoading(true);
        
        const result = await getUserReferralInfo(userId);
        console.log('Received result from getUserReferralInfo:', result);
        
        if (result.error) {
          console.error("Error loading referral info:", result.error);
          setError(t('referral.errorLoading'));
          return;
        }
        
        // Генерируем локальную ссылку, если ссылка с сервера пуста
        const finalReferralLink = result.referralLink || 
          (result.referralCode ? generateLocalReferralLink(result.referralCode) : '');
        
        setReferralInfo({
          referralCode: result.referralCode ?? '',
          referralLink: finalReferralLink,
          totalReferrals: result.totalReferrals ?? 0,
          activeReferrals: result.activeReferrals ?? 0,
        });
        
        console.log('Successfully set referral info state');
        
      } catch (err) {
        console.error("Exception loading referral info:", err);
        setError(t('referral.errorLoading'));
      } finally {
        setLoading(false);
        console.log('Loading state set to false');
        loadingRef.current = false;
      }
    };
    
    if (userId && !loadingRef.current) {
      loadReferralInfo();
    }
  }, [userId, t, locale]);
  
  // Копирование реферальной ссылки
  const copyToClipboard = () => {
    if (!referralInfo) return;
    
    navigator.clipboard.writeText(referralInfo.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Отслеживаем событие копирования
      track('Copy Referral Link', {
        userId,
        referralCode: referralInfo.referralCode
      });
    });
  };
  
  // Показываем состояние загрузки
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }
  
  // Показываем ошибку
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // Показываем информацию о рефералах
  if (!referralInfo || !referralInfo.referralCode) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
        <p>{t('referral.noData')}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Реферальная ссылка */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">{t('referral.yourCode')}</h3>
        <div className="flex items-center space-x-2 mb-2">
          <div className="bg-slate-100 p-2 rounded font-mono text-center flex-1">
            {referralInfo.referralCode}
          </div>
        </div>
        
        <h3 className="text-lg font-medium mb-2">{t('referral.yourLink')}</h3>
        <div className="flex space-x-2">
          <Input 
            value={referralInfo.referralLink} 
            readOnly 
            className="flex-1 font-mono text-sm"
          />
          <Button onClick={copyToClipboard} className="shrink-0">
            {copied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? t('referral.linkCopied') : t('referral.copyLink')}
          </Button>
        </div>
      </div>
      
      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-4 bg-slate-50 rounded-lg">
          <Users className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{referralInfo.totalReferrals}</p>
          <p className="text-sm text-muted-foreground">{t('referral.stats.invited')}</p>
        </div>
        
        <div className="p-4 bg-slate-50 rounded-lg">
          <User className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{referralInfo.activeReferrals}</p>
          <p className="text-sm text-muted-foreground">{t('referral.stats.active')}</p>
        </div>
      </div>
      
      {/* Информация о программе */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">{t('referral.howItWorks')}</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
          <li>{t('referral.step1')}</li>
          <li>{t('referral.step2')}</li>
          <li>{t('referral.step3')}</li>
        </ol>
      </div>
    </div>
  );
}