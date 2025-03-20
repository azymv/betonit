'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/i18n-config';
import { useMediaTypeDetection } from './hooks/useMediaTypeDetection';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  short_description?: string;
  image_url?: string;
  media_url?: string;
  bet_closing_date?: string;
  has_user_bet?: boolean;
}

interface PlayEventCardProps {
  event: Event;
  onBetYes: () => void;
  onBetNo: () => void;
  isLast?: boolean;
  userBalance?: number;
  hasBet?: boolean;
}

export default function PlayEventCard({ 
  event, 
  onBetYes, 
  onBetNo, 
  isLast = false, 
  userBalance = 0,
  hasBet = false 
}: PlayEventCardProps) {
  const params = useParams();
  const locale = params.locale as string || 'en';
  const { t } = useTranslation(locale);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Определяем тип медиа (изображение или видео)
  const mediaUrl = event.media_url || event.image_url;
  const { mediaType, loading } = useMediaTypeDetection(mediaUrl);
  
  // Форматирование даты закрытия ставок
  const formattedDate = event.bet_closing_date 
    ? format(new Date(event.bet_closing_date), 'dd MMM, HH:mm')
    : '';
  
  // Возвращаем дату закрытия в читаемом формате
  const getClosingInfo = () => {
    if (!event.bet_closing_date) return '';
    
    const closingDate = new Date(event.bet_closing_date);
    const now = new Date();
    
    // Если дата закрытия уже прошла
    if (closingDate < now) {
      return t('events.ended');
    }
    
    // Вычисляем разницу
    const diffMs = closingDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      // Если меньше 24 часов, показываем часы
      return `${t('events.ends')} ${diffHours}h`;
    } else {
      // Иначе показываем дни
      const diffDays = Math.floor(diffHours / 24);
      return `${t('events.ends')} ${diffDays}d`;
    }
  };
  
  // Для обработки ошибок загрузки изображения
  const handleImageError = () => {
    console.error(`Failed to load image: ${mediaUrl}`);
    setImageError(true);
  };
  
  // Для обработки успешной загрузки изображения
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Отображаем медиа в зависимости от типа
  const renderMedia = () => {
    if (!mediaUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <p className="text-gray-500">{t('common.noMedia')}</p>
        </div>
      );
    }
    
    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (imageError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <p className="text-red-500">{t('errors.mediaLoadFailed')}</p>
        </div>
      );
    }
    
    if (mediaType === 'video') {
      return (
        <video 
          className="w-full h-full object-cover"
          autoPlay 
          muted 
          loop 
          playsInline
          controls={false}
          src={mediaUrl}
          onError={handleImageError}
        />
      );
    }
    
    // По умолчанию отображаем изображение
    return (
      <img
        src={mediaUrl}
        alt={event.title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    );
  };
  
  return (
    <div className="relative bg-black overflow-hidden rounded-xl border border-gray-800 shadow-2xl w-full max-w-md mx-auto">
      {/* Заголовок события */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent pt-4 pb-8 px-4">
        <h2 className="text-xl font-bold text-white">{event.title}</h2>
        {event.short_description && (
          <p className="text-gray-300 text-sm mt-1">{event.short_description}</p>
        )}
      </div>
      
      {/* Медиа контент */}
      <div className="w-full h-96 relative overflow-hidden bg-gray-900">
        {renderMedia()}
        
        {/* Оверлей градиент снизу */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent"></div>
      </div>
      
      {/* Информация о ставке */}
      <div className="p-4 bg-gray-900 text-white">
        {/* Дата закрытия ставок */}
        {event.bet_closing_date && (
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm text-gray-400">{getClosingInfo()}</span>
            <span className="text-sm text-gray-400">{formattedDate}</span>
          </div>
        )}
        
        {/* Заголовок для выбора предсказания */}
        {!isLast && !hasBet && (
          <div className="mb-3">
            <p className="text-sm text-center text-gray-400">
              {t('events.betPredict')}
            </p>
          </div>
        )}
        
        {/* Кнопки ставок */}
        {isLast ? (
          <div className="text-center py-2">
            <p className="text-gray-400">{t('events.noMoreEvents')}</p>
          </div>
        ) : hasBet ? (
          <div className="text-center py-3 bg-gray-800 rounded-lg">
            <p className="text-green-400">{t('events.alreadyBet')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onBetYes}
              className="py-3 rounded-lg flex items-center justify-center bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" /> {t('common.yes')}
            </button>
            <button
              onClick={onBetNo}
              className="py-3 rounded-lg flex items-center justify-center bg-purple-600 text-white transition-colors hover:bg-purple-700"
            >
              <XCircle className="h-5 w-5 mr-2" /> {t('common.no')}
            </button>
          </div>
        )}
        
        {/* Информация о балансе */}
        <div className="mt-3 text-center">
          <span className="text-sm text-gray-400">
            {t('profile.balance')}: {userBalance} {t('common.coins')}
          </span>
        </div>
      </div>
    </div>
  );
} 