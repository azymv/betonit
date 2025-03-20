'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n-config';

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  balance: number;
  locale?: string;
}

export default function BetModal({ isOpen, onClose, onConfirm, balance, locale = 'en' }: BetModalProps) {
  const { t } = useTranslation(locale);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Predefined bet amounts
  const betAmounts = [10, 50, 100, 500];
  
  // Handle confirm button click
  const handleConfirm = () => {
    if (selectedAmount === null) return;
    
    setShowSuccess(true);
    
    // Show success animation then call onConfirm
    setTimeout(() => {
      onConfirm(selectedAmount);
      setSelectedAmount(null);
      setShowSuccess(false);
    }, 1000);
  };
  
  // Close modal
  const handleClose = () => {
    setSelectedAmount(null);
    setShowSuccess(false);
    onClose();
  };
  
  // Insufficient balance check
  const hasInsufficientBalance = (amount: number) => balance < amount;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-black border border-white/20 rounded-2xl p-6 w-[90%] max-w-md"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal content */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-1">{t('events.placeBet')}</h3>
              <p className="text-white/70">{t('events.currentBalance')}: {balance} {t('common.coins')}</p>
            </div>
            
            {/* Bet amount buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {betAmounts.map(amount => {
                const isInsufficient = hasInsufficientBalance(amount);
                
                return (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? "default" : "outline"}
                    onClick={() => setSelectedAmount(amount)}
                    disabled={isInsufficient}
                    className={`
                      relative h-14 text-lg font-medium
                      ${selectedAmount === amount ? 'bg-white text-black' : 'text-white'}
                      ${isInsufficient ? 'opacity-50' : ''}
                    `}
                  >
                    {amount} {t('common.coins')}
                    {isInsufficient && (
                      <span className="absolute bottom-1 text-xs opacity-80">
                        {t('errors.insufficientBalance')}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1 border border-white/20 text-white"
              >
                {t('common.cancel')}
              </Button>
              
              <Button
                variant="default"
                onClick={handleConfirm}
                disabled={selectedAmount === null || hasInsufficientBalance(selectedAmount)}
                className={`
                  flex-1 relative overflow-hidden
                  ${showSuccess ? 'bg-green-500 text-white' : 'bg-white text-black'}
                `}
              >
                {showSuccess ? (
                  <motion.div
                    initial={{ y: 50 }}
                    animate={{ y: 0 }}
                    className="flex items-center justify-center"
                  >
                    <span className="mr-1">✓</span> {t('common.processing')}
                  </motion.div>
                ) : (
                  t('events.placeBetButton')
                )}
                
                {/* Coin animation */}
                {showSuccess && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          x: Math.random() * 200 - 100, 
                          y: -50, 
                          opacity: 1,
                          scale: Math.random() * 0.5 + 0.5
                        }}
                        animate={{ 
                          y: 100, 
                          opacity: 0,
                          transition: { 
                            duration: Math.random() * 0.8 + 0.5,
                            delay: Math.random() * 0.3
                          }
                        }}
                        className="absolute w-4 h-4 rounded-full bg-yellow-400 left-1/2 top-1/2"
                      />
                    ))}
                  </div>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 