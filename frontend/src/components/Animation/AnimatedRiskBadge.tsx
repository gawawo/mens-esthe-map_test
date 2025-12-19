'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { RiskLevel } from '@/types/shop';

interface AnimatedRiskBadgeProps {
  riskLevel: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const riskConfig = {
  safe: {
    icon: '7',
    label: '安全',
    colorClass: 'risk-chip-safe',
    animation: 'shimmer',
    pulseDelay: 0,
  },
  gamble: {
    icon: '?',
    label: 'ギャンブル',
    colorClass: 'risk-chip-gamble',
    animation: 'pulse',
    pulseDelay: 0,
  },
  mine: {
    icon: 'X',
    label: '地雷',
    colorClass: 'risk-chip-mine',
    animation: 'shake',
    pulseDelay: 0,
  },
  fake: {
    icon: '👻',
    label: 'サクラ疑惑',
    colorClass: 'risk-chip-fake',
    animation: 'fade',
    pulseDelay: 0,
  },
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

type EaseType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

const getPulseVariant = (riskLevel: RiskLevel) => {
  const ease: EaseType = 'easeInOut';

  switch (riskLevel) {
    case 'safe':
      return {
        scale: [1, 1.02, 1],
        boxShadow: [
          '0 0 10px rgba(0, 255, 136, 0.5)',
          '0 0 20px rgba(0, 255, 136, 0.8), 0 0 30px rgba(0, 255, 136, 0.4)',
          '0 0 10px rgba(0, 255, 136, 0.5)',
        ],
        transition: { duration: 2, repeat: Infinity, ease },
      };
    case 'gamble':
      return {
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 0 10px rgba(255, 215, 0, 0.5)',
          '0 0 25px rgba(255, 215, 0, 0.9), 0 0 40px rgba(255, 215, 0, 0.5)',
          '0 0 10px rgba(255, 215, 0, 0.5)',
        ],
        transition: { duration: 1.5, repeat: Infinity, ease },
      };
    case 'mine':
      return {
        scale: [1, 1.08, 1],
        boxShadow: [
          '0 0 10px rgba(255, 51, 102, 0.5)',
          '0 0 30px rgba(255, 51, 102, 1), 0 0 50px rgba(255, 51, 102, 0.6)',
          '0 0 10px rgba(255, 51, 102, 0.5)',
        ],
        transition: { duration: 0.8, repeat: Infinity, ease },
      };
    case 'fake':
    default:
      return {
        opacity: [0.7, 0.4, 0.7],
        transition: { duration: 3, repeat: Infinity, ease },
      };
  }
};

const shakeVariants = {
  shake: {
    x: [-2, 2, -2, 2, 0],
    transition: { duration: 0.4, repeat: Infinity, repeatDelay: 2 },
  },
};

export function AnimatedRiskBadge({
  riskLevel,
  size = 'md',
  showLabel = false,
}: AnimatedRiskBadgeProps) {
  const shouldReduceMotion = useReducedMotion();
  const config = riskConfig[riskLevel];

  if (shouldReduceMotion) {
    return (
      <div className="flex items-center gap-2">
        <div className={`risk-chip ${config.colorClass} ${sizeClasses[size]}`}>
          {config.icon}
        </div>
        {showLabel && (
          <span className={`text-${riskLevel} text-sm font-medium`}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`risk-chip ${config.colorClass} ${sizeClasses[size]}`}
        animate={getPulseVariant(riskLevel)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          animate={riskLevel === 'mine' ? shakeVariants.shake : undefined}
        >
          {config.icon}
        </motion.span>
      </motion.div>
      {showLabel && (
        <motion.span
          className={`text-${riskLevel} text-sm font-medium`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {config.label}
        </motion.span>
      )}
    </div>
  );
}
