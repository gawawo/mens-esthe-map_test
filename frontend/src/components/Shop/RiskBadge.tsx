'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { RiskLevel } from '@/types';
import { RISK_LEVEL_LABELS, RISK_LEVEL_ICONS } from '@/lib/constants';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: 'badge' | 'chip';
  animated?: boolean;
}

// 従来のバッジ用アイコン
const BADGE_ICONS: Record<RiskLevel, string> = {
  safe: '✓',
  gamble: '🎲',
  mine: '💣',
  fake: '👻',
};

// チップサイズ
const CHIP_SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

// バッジサイズ
const BADGE_SIZES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

// アニメーション設定
type EaseType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

const getPulseVariant = (level: RiskLevel) => {
  const ease: EaseType = 'easeInOut';

  switch (level) {
    case 'safe':
      return {
        scale: [1, 1.02, 1],
        boxShadow: [
          '0 0 10px rgba(0, 255, 136, 0.5), inset 0 0 8px rgba(0, 255, 136, 0.1)',
          '0 0 20px rgba(0, 255, 136, 0.8), 0 0 30px rgba(0, 255, 136, 0.4), inset 0 0 8px rgba(0, 255, 136, 0.1)',
          '0 0 10px rgba(0, 255, 136, 0.5), inset 0 0 8px rgba(0, 255, 136, 0.1)',
        ],
        transition: { duration: 2, repeat: Infinity, ease },
      };
    case 'gamble':
      return {
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 0 10px rgba(255, 215, 0, 0.5), inset 0 0 8px rgba(255, 215, 0, 0.1)',
          '0 0 25px rgba(255, 215, 0, 0.9), 0 0 40px rgba(255, 215, 0, 0.5), inset 0 0 8px rgba(255, 215, 0, 0.1)',
          '0 0 10px rgba(255, 215, 0, 0.5), inset 0 0 8px rgba(255, 215, 0, 0.1)',
        ],
        transition: { duration: 1.5, repeat: Infinity, ease },
      };
    case 'mine':
      return {
        scale: [1, 1.08, 1],
        boxShadow: [
          '0 0 10px rgba(255, 51, 102, 0.5), inset 0 0 8px rgba(255, 51, 102, 0.1)',
          '0 0 30px rgba(255, 51, 102, 1), 0 0 50px rgba(255, 51, 102, 0.6), inset 0 0 8px rgba(255, 51, 102, 0.1)',
          '0 0 10px rgba(255, 51, 102, 0.5), inset 0 0 8px rgba(255, 51, 102, 0.1)',
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
  x: [-2, 2, -2, 2, 0],
  transition: { duration: 0.4, repeat: Infinity, repeatDelay: 2 },
};

export function RiskBadge({
  level,
  size = 'md',
  showIcon = true,
  showLabel = true,
  variant = 'chip',
  animated = true,
}: RiskBadgeProps) {
  const shouldReduceMotion = useReducedMotion();
  const isAnimated = animated && !shouldReduceMotion;

  // チップスタイル (新デザイン)
  if (variant === 'chip') {
    const chipColorClasses: Record<RiskLevel, string> = {
      safe: 'border-safe text-safe',
      gamble: 'border-gamble text-gamble',
      mine: 'border-mine text-mine',
      fake: 'border-fake text-fake opacity-70',
    };

    return (
      <div className="flex items-center gap-2">
        <motion.div
          className={`
            relative inline-flex items-center justify-center
            rounded-full border-2 border-dashed
            font-score font-bold
            bg-casino-black
            ${CHIP_SIZES[size]}
            ${chipColorClasses[level]}
          `}
          animate={isAnimated ? getPulseVariant(level) : undefined}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{
            boxShadow: isAnimated
              ? undefined
              : `0 0 10px var(--color-${level}-glow, rgba(255,215,0,0.3)), inset 0 0 8px rgba(255,255,255,0.05)`,
          }}
        >
          {/* インナーリング */}
          <div className="absolute inset-1 rounded-full border border-current opacity-30" />

          {/* アイコン */}
          <motion.span
            animate={isAnimated && level === 'mine' ? shakeVariants : undefined}
          >
            {RISK_LEVEL_ICONS[level]}
          </motion.span>
        </motion.div>

        {showLabel && (
          <motion.span
            className={`text-${level} text-sm font-medium`}
            initial={isAnimated ? { opacity: 0, x: -10 } : undefined}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {RISK_LEVEL_LABELS[level]}
          </motion.span>
        )}
      </div>
    );
  }

  // バッジスタイル (従来デザイン、ダークテーマ対応)
  const badgeColorClasses: Record<RiskLevel, string> = {
    safe: 'bg-safe/20 text-safe border-safe/30',
    gamble: 'bg-gamble/20 text-gamble border-gamble/30',
    mine: 'bg-mine/20 text-mine border-mine/30',
    fake: 'bg-fake/20 text-fake border-fake/30 opacity-70',
  };

  return (
    <motion.span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        ${badgeColorClasses[level]}
        ${BADGE_SIZES[size]}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {showIcon && <span>{BADGE_ICONS[level]}</span>}
      {showLabel && <span>{RISK_LEVEL_LABELS[level]}</span>}
    </motion.span>
  );
}

// 小型チップ (マーカー用)
export function RiskChipSmall({ level }: { level: RiskLevel }) {
  const chipColorClasses: Record<RiskLevel, string> = {
    safe: 'border-safe text-safe shadow-neon-safe',
    gamble: 'border-gamble text-gamble shadow-neon-gamble',
    mine: 'border-mine text-mine shadow-neon-mine',
    fake: 'border-fake text-fake shadow-neon-fake opacity-70',
  };

  return (
    <div
      className={`
        w-6 h-6 rounded-full border-2 border-dashed
        bg-casino-black
        flex items-center justify-center
        font-score font-bold text-xs
        ${chipColorClasses[level]}
      `}
    >
      {RISK_LEVEL_ICONS[level]}
    </div>
  );
}
