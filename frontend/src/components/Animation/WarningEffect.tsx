'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface WarningEffectProps {
  children: ReactNode;
  type: 'shake' | 'flash' | 'pulse';
  trigger: boolean;
  className?: string;
}

const shakeVariants = {
  shake: {
    x: [0, -4, 4, -4, 4, -2, 2, 0],
    transition: { duration: 0.5, ease: 'easeInOut' as const },
  },
  idle: { x: 0 },
};

const flashVariants = {
  flash: {
    backgroundColor: [
      'rgba(255, 51, 102, 0.1)',
      'rgba(255, 51, 102, 0.3)',
      'rgba(255, 51, 102, 0.1)',
      'rgba(255, 51, 102, 0.3)',
      'rgba(255, 51, 102, 0.1)',
    ],
    borderColor: [
      'rgba(255, 51, 102, 0.5)',
      'rgba(255, 51, 102, 1)',
      'rgba(255, 51, 102, 0.5)',
      'rgba(255, 51, 102, 1)',
      'rgba(255, 51, 102, 0.5)',
    ],
    transition: { duration: 0.5, ease: 'easeInOut' as const },
  },
  idle: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 51, 102, 0.5)',
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.02, 1, 1.02, 1],
    boxShadow: [
      '0 0 0 0 rgba(255, 51, 102, 0.4)',
      '0 0 0 10px rgba(255, 51, 102, 0)',
      '0 0 0 0 rgba(255, 51, 102, 0.4)',
      '0 0 0 10px rgba(255, 51, 102, 0)',
      '0 0 0 0 rgba(255, 51, 102, 0)',
    ],
    transition: { duration: 1, ease: 'easeInOut' as const },
  },
  idle: { scale: 1 },
};

export function WarningEffect({
  children,
  type,
  trigger,
  className = '',
}: WarningEffectProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants =
    type === 'shake'
      ? shakeVariants
      : type === 'flash'
      ? flashVariants
      : pulseVariants;

  return (
    <motion.div
      className={className}
      variants={variants}
      animate={trigger ? type : 'idle'}
    >
      {children}
    </motion.div>
  );
}

// Danger indicator badge
export function DangerIndicator({
  show,
  message = '危険',
}: {
  show: boolean;
  message?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (!show) return null;

  return (
    <motion.div
      className="absolute -top-2 -right-2 bg-mine text-white text-xs font-bold px-2 py-1 rounded-full z-10"
      initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0, opacity: 0 }}
      animate={
        shouldReduceMotion
          ? { opacity: 1 }
          : {
              scale: [0, 1.2, 1],
              opacity: 1,
            }
      }
      transition={{ duration: 0.3, ease: 'backOut' }}
      style={{
        boxShadow: '0 0 10px rgba(255, 51, 102, 0.5)',
      }}
    >
      <motion.span
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.1, 1],
              }
        }
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        {message}
      </motion.span>
    </motion.div>
  );
}
