'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayEventCard from './PlayEventCard';
import BetModal from '../BetModal';
import { useTranslation } from '@/lib/i18n-config';
import { toast } from 'react-hot-toast';
import { useParams } from 'next/navigation';

// Компонент для отображения спиннера загрузки
const LoadingSpinner = ({ size, className }: { size?: number; className?: string }) => (
  <div className={`animate-spin rounded-full border-4 border-blue-600 border-t-transparent ${className || ''}`}
       style={{ width: `${size || 24}px`, height: `${size || 24}px` }} />
);

interface PlayEvent {
  id: string;
  title: string;
  short_description?: string;
  image_url?: string;
  media_url?: string;
  bet_closing_date?: string;
  has_user_bet?: boolean;
}

interface PlayFeedProps {
  userId?: string;
}

const PlayFeed = ({ userId }: PlayFeedProps) => {
  const params = useParams();
  const locale = params.locale as string || 'en';
  const { t } = useTranslation(locale);
  
  const [events, setEvents] = useState<PlayEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState('10'); // По умолчанию 10 монет
  const [placingBet, setPlacingBet] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showBetModal, setShowBetModal] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<'yes' | 'no'>('yes');
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Получаем баланс пользователя
  const fetchBalance = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/users/balance?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      setUserBalance(data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error(t('errors.balanceFetchFailed'));
    }
  };

  // Загружаем события для Play ленты
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching events for page ${page} with userId ${userId || 'none'}`);
      
      const url = `/api/play/events?page=${page}&pageSize=10${userId ? `&userId=${userId}` : ''}`;
      console.log('Fetching URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', response.status, errorData);
        throw new Error(`API error ${response.status}: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (page === 1) {
        setEvents(data.events || []);
        if (data.events && data.events.length > 0) {
          setCurrentEventIndex(0);
        }
      } else {
        setEvents(prev => [...prev, ...(data.events || [])]);
      }
      
      // Если нет событий или их меньше, чем размер страницы - значит, больше нет
      setHasMore(data.events && data.events.length > 0 && data.events.length === 10);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error instanceof Error ? error.message : 'Failed to load events');
      toast.error(t('errors.failedToLoadEvents'));
    } finally {
      setLoading(false);
    }
  };

  // Загружаем события при монтировании и изменении страницы
  useEffect(() => {
    fetchEvents();
  }, [page, userId]);

  // Загружаем баланс при монтировании
  useEffect(() => {
    if (userId) {
      fetchBalance();
    }
  }, [userId]);

  // Обработчик для перехода к следующему событию
  const handleNext = () => {
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
    } else if (hasMore) {
      // Загружаем следующую страницу, если это последнее событие и есть еще
      setPage(prev => prev + 1);
    } else {
      // Показываем сообщение, что больше нет событий
      toast(t('events.noMoreEvents'));
    }
  };

  // Обработчик для перехода к предыдущему событию
  const handlePrev = () => {
    if (currentEventIndex > 0) {
      setCurrentEventIndex(prev => prev - 1);
    }
  };

  // Обработчик для открытия модального окна ставок с выбранным типом предсказания
  const handleBet = (prediction: 'yes' | 'no') => {
    if (!userId) {
      toast.error(t('errors.notLoggedIn'));
      return;
    }
    
    const currentEvent = events[currentEventIndex];
    if (currentEvent?.has_user_bet) {
      toast(t('events.alreadyBet'));
      return;
    }
    
    // Устанавливаем выбранное предсказание и открываем модальное окно
    setSelectedPrediction(prediction);
    setBetAmount('10'); // Сбрасываем сумму ставки на 10 при каждом открытии
    setShowBetModal(true);
  };

  // Обработчик для размещения ставки
  const placeBet = async (amount: string, prediction: 'yes' | 'no') => {
    if (!userId || !events[currentEventIndex]) {
      toast.error(t('errors.notLoggedIn'));
      return;
    }
    
    try {
      setPlacingBet(true);
      
      // Проверяем, что сумма ставки валидна
      const betAmount = parseFloat(amount);
      if (isNaN(betAmount) || betAmount <= 0) {
        throw new Error('Invalid bet amount');
      }
      
      // Проверяем, достаточно ли средств
      if (userBalance !== null && betAmount > userBalance) {
        throw new Error('Insufficient funds');
      }
      
      // Отправляем запрос на размещение ставки
      const response = await fetch('/api/bets/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          eventId: events[currentEventIndex].id,
          amount: betAmount,
          prediction
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place bet');
      }
      
      // Успешно разместили ставку
      toast.success(t('events.betPlacedSuccess'));
      
      // Обновляем баланс пользователя
      fetchBalance();
      
      // Обновляем статус события (пользователь уже сделал ставку)
      setEvents(prevEvents => 
        prevEvents.map((event, index) => 
          index === currentEventIndex 
            ? { ...event, has_user_bet: true } 
            : event
        )
      );
      
      // Закрываем модальное окно
      setShowBetModal(false);
      
      // Переходим к следующему событию после небольшой задержки
      setTimeout(() => {
        handleNext();
      }, 1500);
      
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error(error instanceof Error ? error.message : t('errors.failedToPlaceBet'));
    } finally {
      setPlacingBet(false);
    }
  };

  // Если ошибка - показываем сообщение об ошибке
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
        <h2 className="text-xl font-bold mb-4">
          {t('errors.somethingWentWrong')}
        </h2>
        <p className="text-gray-400 mb-6">
          {error}
        </p>
        <button
          onClick={() => {
            setError(null);
            setPage(1);
            fetchEvents();
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {t('actions.tryAgain')}
        </button>
      </div>
    );
  }

  // Если загрузка и нет событий - показываем индикатор загрузки
  if (loading && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <LoadingSpinner size={40} className="mb-4" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  // Если нет событий после загрузки - показываем сообщение
  if (!loading && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
        <h2 className="text-xl font-bold mb-4">
          {t('events.noEventsFound')}
        </h2>
        <p className="text-gray-400 mb-6">
          {t('events.tryDifferentFilters')}
        </p>
      </div>
    );
  }
  
  console.log(`Rendering feed with ${events.length} events, current index: ${currentEventIndex}`);
  
  // Текущее событие
  const currentEvent = events[currentEventIndex];
  
  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[100svh] overflow-hidden bg-black"
    >
      {/* Вертикальная область для свайпов */}
      <div 
        className="w-full h-full touch-pan-y"
        onTouchStart={(e) => {
          // Обработка начала свайпа
          const touchY = e.touches[0].clientY;
          const threshold = 50;
          
          const handleTouchEnd = (e: TouchEvent) => {
            const endY = e.changedTouches[0].clientY;
            
            if (touchY - endY > threshold) {
              // Свайп вверх - следующее событие
              handleNext();
            } else if (endY - touchY > threshold) {
              // Свайп вниз - предыдущее событие
              handlePrev();
            }
            
            document.removeEventListener('touchend', handleTouchEnd);
          };
          
          document.addEventListener('touchend', handleTouchEnd);
        }}
      >
        <AnimatePresence initial={false}>
          {currentEvent ? (
            <motion.div
              key={currentEvent.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex items-center justify-center p-4"
            >
              <PlayEventCard
                event={currentEvent}
                onBetYes={() => handleBet('yes')}
                onBetNo={() => handleBet('no')}
                isLast={currentEventIndex === events.length - 1 && !hasMore}
                userBalance={userBalance || 0}
                hasBet={currentEvent.has_user_bet}
              />
            </motion.div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <LoadingSpinner size={40} />
            </div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Навигационные кнопки */}
      <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 flex justify-between px-6 z-20">
        <button
          onClick={handlePrev}
          disabled={currentEventIndex === 0}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            currentEventIndex === 0
              ? 'bg-gray-800 text-gray-600'
              : 'bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="w-12 h-12 rounded-full bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
      
      {/* Модальное окно для ставки */}
      {currentEvent && (
        <BetModal
          isOpen={showBetModal}
          onClose={() => setShowBetModal(false)}
          onPlaceBet={placeBet}
          eventTitle={currentEvent.title}
          betAmount={betAmount}
          onBetAmountChange={setBetAmount}
          userBalance={userBalance || 0}
          loading={placingBet}
          locale={locale}
          selectedPrediction={selectedPrediction}
        />
      )}
    </div>
  );
};

export default PlayFeed; 