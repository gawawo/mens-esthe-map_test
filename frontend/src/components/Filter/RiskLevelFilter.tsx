'use client';

import { motion } from 'framer-motion';
import { useFilterStore } from '@/stores/filterStore';
import type { RiskLevel } from '@/types';
import { RISK_LEVEL_LABELS, RISK_LEVEL_ICONS } from '@/lib/constants';

const RISK_LEVELS: RiskLevel[] = ['safe', 'gamble', 'mine', 'fake'];

// カジノテーマカラー
const LEVEL_COLORS: Record<RiskLevel, {
  border: string;
  text: string;
  glow: string;
  bg: string;
}> = {
  safe: {
    border: 'border-safe',
    text: 'text-safe',
    glow: 'shadow-neon-safe',
    bg: 'bg-safe/10',
  },
  gamble: {
    border: 'border-gamble',
    text: 'text-gamble',
    glow: 'shadow-neon-gamble',
    bg: 'bg-gamble/10',
  },
  mine: {
    border: 'border-mine',
    text: 'text-mine',
    glow: 'shadow-neon-mine',
    bg: 'bg-mine/10',
  },
  fake: {
    border: 'border-fake',
    text: 'text-fake',
    glow: 'shadow-neon-fake',
    bg: 'bg-fake/10',
  },
};

export function RiskLevelFilter() {
  const { selectedRiskLevels, toggleRiskLevel } = useFilterStore();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-display tracking-wide text-gold/80">リスクレベル</h3>
      <div className="flex flex-wrap gap-2">
        {RISK_LEVELS.map((level) => {
          const isSelected = selectedRiskLevels.includes(level);
          const colors = LEVEL_COLORS[level];

          return (
            <motion.button
              key={level}
              onClick={() => toggleRiskLevel(level)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
                border-2 border-dashed transition-all
                ${isSelected
                  ? `${colors.border} ${colors.text} ${colors.bg} ${colors.glow}`
                  : 'border-white/10 text-white/30 bg-casino-black/30'
                }
                ${level === 'fake' && isSelected ? 'opacity-70' : ''}
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* チップアイコン */}
              <span
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  text-xs font-score font-bold
                  ${isSelected
                    ? `bg-casino-black ${colors.border} border`
                    : 'bg-casino-felt border border-white/10'
                  }
                `}
              >
                {RISK_LEVEL_ICONS[level]}
              </span>
              <span>{RISK_LEVEL_LABELS[level]}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
