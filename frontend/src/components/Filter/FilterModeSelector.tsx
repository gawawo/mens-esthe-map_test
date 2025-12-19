'use client';

import { motion } from 'framer-motion';
import { useFilterStore } from '@/stores/filterStore';
import type { FilterMode } from '@/types';
import { FILTER_MODE_CONFIG } from '@/types/map';

const MODE_ICONS: Record<FilterMode, string> = {
  all: '🗺️',
  'safe-first': '7',
  gambler: '🎲',
  minefield: '💣',
};

const MODE_COLORS: Record<FilterMode, { active: string; glow: string }> = {
  all: { active: 'border-gold/50', glow: 'shadow-glow-gamble' },
  'safe-first': { active: 'border-safe/50', glow: 'shadow-glow-safe' },
  gambler: { active: 'border-gamble/50', glow: 'shadow-glow-gamble' },
  minefield: { active: 'border-mine/50', glow: 'shadow-glow-mine' },
};

export function FilterModeSelector() {
  const { mode, setMode } = useFilterStore();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-display tracking-wide text-gold/80">表示モード</h3>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(FILTER_MODE_CONFIG) as FilterMode[]).map((modeKey) => {
          const config = FILTER_MODE_CONFIG[modeKey];
          const isActive = mode === modeKey;
          const colors = MODE_COLORS[modeKey];

          return (
            <motion.button
              key={modeKey}
              onClick={() => setMode(modeKey)}
              className={`
                p-3 rounded-lg text-left transition-all border
                ${isActive
                  ? `bg-casino-felt ${colors.active} ${colors.glow}`
                  : 'bg-casino-black/30 border-white/5 hover:border-white/20'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <span className={`text-lg ${modeKey === 'safe-first' ? 'font-score font-bold text-safe' : ''}`}>
                  {MODE_ICONS[modeKey]}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isActive ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-1 line-clamp-1">{config.description}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
