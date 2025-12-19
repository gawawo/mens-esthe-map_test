'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useFilterStore } from '@/stores/filterStore';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { RISK_LEVEL_ICONS, RISK_LEVEL_LABELS, RISK_LEVEL_DESCRIPTIONS } from '@/lib/constants';
import type { RiskLevel } from '@/types';

const RISK_LEVELS: RiskLevel[] = ['safe', 'gamble', 'mine', 'fake'];

// カジノテーマカラー
const LEVEL_COLORS: Record<RiskLevel, {
  border: string;
  text: string;
  glow: string;
  bg: string;
  glowColor: string;
}> = {
  safe: {
    border: 'border-safe',
    text: 'text-safe',
    glow: 'shadow-neon-safe',
    bg: 'bg-safe/10',
    glowColor: 'rgba(0, 255, 136, 0.5)',
  },
  gamble: {
    border: 'border-gamble',
    text: 'text-gamble',
    glow: 'shadow-neon-gamble',
    bg: 'bg-gamble/10',
    glowColor: 'rgba(255, 215, 0, 0.5)',
  },
  mine: {
    border: 'border-mine',
    text: 'text-mine',
    glow: 'shadow-neon-mine',
    bg: 'bg-mine/10',
    glowColor: 'rgba(255, 51, 102, 0.5)',
  },
  fake: {
    border: 'border-fake',
    text: 'text-fake',
    glow: 'shadow-neon-fake',
    bg: 'bg-fake/10',
    glowColor: 'rgba(139, 92, 246, 0.5)',
  },
};

export function MapFilterChips() {
  const shouldReduceMotion = useReducedMotion();
  const { isMobile } = useBreakpoint();
  const { selectedRiskLevels, toggleRiskLevel } = useFilterStore();

  return (
    <div className={`absolute z-30 pointer-events-none ${
      isMobile ? 'top-16 left-2' : 'top-20 left-2'
    }`}>
      <motion.div
        className="flex flex-col gap-2 pointer-events-auto"
        initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* リスクレベルチップ */}
        <div
          className={`flex gap-2 bg-casino-velvet/90 backdrop-blur-sm p-1.5 border border-gold/20 ${
            isMobile ? 'flex-col rounded-2xl' : 'flex-row items-center rounded-full'
          }`}
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
        >
          {RISK_LEVELS.map((level, index) => {
            const isSelected = selectedRiskLevels.includes(level);
            const colors = LEVEL_COLORS[level];

            return (
              <motion.button
                key={level}
                onClick={() => toggleRiskLevel(level)}
                className={`
                  ${isMobile ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}
                  rounded-full flex items-center justify-center
                  border-2 border-dashed font-score font-bold
                  transition-colors
                  ${isSelected
                    ? `${colors.border} ${colors.text} bg-casino-black`
                    : 'border-white/20 text-white/30 bg-casino-black/50'
                  }
                  ${level === 'fake' && isSelected ? 'opacity-70' : ''}
                `}
                style={isSelected ? {
                  boxShadow: `0 0 10px ${colors.glowColor}`,
                } : {}}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                title={`${RISK_LEVEL_LABELS[level]}: ${RISK_LEVEL_DESCRIPTIONS[level]}`}
              >
                {RISK_LEVEL_ICONS[level]}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
