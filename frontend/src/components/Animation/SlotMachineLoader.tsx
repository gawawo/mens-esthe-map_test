'use client';

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SlotMachineLoaderProps {
  isLoading: boolean;
  onComplete?: () => void;
  message?: string;
}

const symbols = ['7', '?', 'X', '👻', '💎', '🎰', '⭐'];

export function SlotMachineLoader({
  isLoading,
  onComplete,
  message = '検索中...',
}: SlotMachineLoaderProps) {
  const [slots, setSlots] = useState(['7', '7', '7']);
  const [spinning, setSpinning] = useState([false, false, false]);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isLoading && !shouldReduceMotion) {
      setSpinning([true, true, true]);

      const intervals = [
        setInterval(() => {
          setSlots((prev) => [
            symbols[Math.floor(Math.random() * symbols.length)],
            prev[1],
            prev[2],
          ]);
        }, 80),
        setInterval(() => {
          setSlots((prev) => [
            prev[0],
            symbols[Math.floor(Math.random() * symbols.length)],
            prev[2],
          ]);
        }, 100),
        setInterval(() => {
          setSlots((prev) => [
            prev[0],
            prev[1],
            symbols[Math.floor(Math.random() * symbols.length)],
          ]);
        }, 120),
      ];

      return () => {
        intervals.forEach(clearInterval);
      };
    } else if (!isLoading) {
      // Stop spinning one by one
      setTimeout(() => setSpinning([false, true, true]), 200);
      setTimeout(() => setSpinning([false, false, true]), 400);
      setTimeout(() => {
        setSpinning([false, false, false]);
        onComplete?.();
      }, 600);
    }
  }, [isLoading, shouldReduceMotion, onComplete]);

  if (shouldReduceMotion) {
    return isLoading ? (
      <div className="flex items-center justify-center gap-2 p-4">
        <div className="w-4 h-4 rounded-full bg-gold animate-pulse" />
        <span className="text-gold">{message}</span>
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex flex-col items-center gap-4 p-6"
        >
          <div className="flex gap-2">
            {slots.map((symbol, index) => (
              <motion.div
                key={index}
                className="w-16 h-20 bg-casino-black rounded-lg border-2 border-gold/30 flex items-center justify-center overflow-hidden"
                style={{
                  boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
                }}
              >
                <motion.span
                  className="text-3xl font-score"
                  animate={
                    spinning[index]
                      ? { y: [0, -20, 0], opacity: [1, 0.5, 1] }
                      : { y: 0 }
                  }
                  transition={
                    spinning[index]
                      ? { duration: 0.1, repeat: Infinity }
                      : { type: 'spring', stiffness: 500, damping: 30 }
                  }
                >
                  {symbol}
                </motion.span>
              </motion.div>
            ))}
          </div>
          <motion.p
            className="text-gold font-display tracking-wider"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {message}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
