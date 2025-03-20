'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n-config';
import LoadingSpinner from './ui/LoadingSpinner';

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceBet: (amount: string, prediction: 'yes' | 'no') => void;
  eventTitle: string;
  betAmount: string;
  onBetAmountChange: (value: string) => void;
  userBalance: number;
  loading: boolean;
  locale?: string;
  selectedPrediction?: 'yes' | 'no';
}

export default function BetModal({ 
  isOpen, 
  onClose, 
  onPlaceBet, 
  eventTitle,
  betAmount,
  onBetAmountChange,
  userBalance,
  loading,
  locale = 'en',
  selectedPrediction = 'yes'
}: BetModalProps) {
  const { t } = useTranslation(locale);
  const [prediction, setPrediction] = useState<'yes' | 'no'>(selectedPrediction);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Обновляем внутреннее состояние при изменении пропса
  useEffect(() => {
    if (selectedPrediction) {
      setPrediction(selectedPrediction);
    }
  }, [selectedPrediction]);
  
  // Предустановленные суммы ставок
  const betOptions = [10, 50, 100, 500, 1000];
  
  // Проверка, достаточно ли средств для ставки
  const hasInsufficientBalance = (amount: number) => {
    return amount > userBalance;
  };
  
  // Обработчик закрытия модального окна
  const handleClose = () => {
    onClose();
    // Сбрасываем состояния при закрытии
    setShowSuccess(false);
  };
  
  // Обработчик выбора суммы ставки
  const handleSelectAmount = (amount: number) => {
    onBetAmountChange(amount.toString());
  };
  
  // Обработчик подтверждения ставки
  const handleConfirm = () => {
    // Показываем анимацию успеха
    if (!loading) {
      onPlaceBet(betAmount, prediction);
    }
  };
  
  // Сбрасываем состояния при открытии/закрытии
  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-1 text-white">{t('events.placeBet')}</h2>
              <p className="text-gray-400 text-sm mb-4">{eventTitle}</p>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-gray-300">{t('events.betPredict')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className={`py-3 rounded-lg text-center transition-colors ${
                      prediction === 'yes' 
                        ? 'bg-secondary text-secondary-foreground' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    onClick={() => setPrediction('yes')}
                  >
                    {t('common.yes')}
                  </button>
                  <button
                    className={`py-3 rounded-lg text-center transition-colors ${
                      prediction === 'no' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    onClick={() => setPrediction('no')}
                  >
                    {t('common.no')}
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-300">{t('events.betAmount')}</h3>
                  <span className="text-sm text-gray-400">
                    {t('profile.balance')}: {userBalance}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {betOptions.map((amount) => (
                    <button
                      key={amount}
                      className={`py-2 px-3 rounded text-center transition-colors ${
                        Number(betAmount) === amount
                          ? 'bg-blue-600 text-white'
                          : hasInsufficientBalance(amount)
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                      onClick={() => handleSelectAmount(amount)}
                      disabled={hasInsufficientBalance(amount)}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => onBetAmountChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder={t('events.enterAmount')}
                  min="1"
                  max={userBalance}
                />
                
                {Number(betAmount) > userBalance && (
                  <p className="text-red-500 text-sm mt-1">
                    {t('errors.insufficientBalance')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-gray-950 p-4 flex gap-3">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1 border border-white/20 text-white"
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              
              <Button
                variant="default"
                onClick={handleConfirm}
                disabled={!betAmount || Number(betAmount) <= 0 || hasInsufficientBalance(Number(betAmount)) || loading}
                className={`
                  flex-1 relative overflow-hidden
                  ${showSuccess ? 'bg-green-500 text-white' : 'bg-white text-black'}
                `}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size={16} className="mr-2" /> 
                    {t('common.processing')}
                  </div>
                ) : (
                  t('events.placeBetButton')
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 