'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface SpeechBubbleProps {
  children: ReactNode;
  isVisible?: boolean;
  variant?: 'ai' | 'user';
  showTail?: boolean;
  className?: string;
}

export function SpeechBubble({
  children,
  isVisible = true,
  variant = 'ai',
  showTail = true,
  className = '',
}: SpeechBubbleProps) {
  const shouldReduceMotion = useReducedMotion();

  const variantStyles = {
    ai: 'bg-casino-felt border-gold/20 text-white rounded-2xl rounded-bl-sm',
    user: 'bg-gradient-to-br from-neon-purple/60 to-fake/40 border-fake/30 text-white rounded-2xl rounded-br-sm',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            relative px-4 py-3 border
            ${variantStyles[variant]}
            ${className}
          `}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
        >
          {children}

          {/* 吹き出しの尻尾 */}
          {showTail && (
            <div
              className={`
                absolute w-3 h-3 transform rotate-45
                ${variant === 'ai'
                  ? 'left-3 -bottom-1.5 bg-casino-felt border-l border-b border-gold/20'
                  : 'right-3 -bottom-1.5 bg-fake/40 border-l border-b border-fake/30'
                }
              `}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// タイピングインジケーター
export function TypingIndicator() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="flex items-center gap-1 text-white/50">
        <span>...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-gold/60"
          animate={{
            y: [0, -4, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}
