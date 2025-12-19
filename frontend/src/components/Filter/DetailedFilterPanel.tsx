'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useDragControls, PanInfo } from 'framer-motion';
import { useFilterStore } from '@/stores/filterStore';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { RISK_LEVEL_ICONS, RISK_LEVEL_LABELS, RISK_LEVEL_DESCRIPTIONS } from '@/lib/constants';
import type { RiskLevel } from '@/types';

const RISK_LEVELS: RiskLevel[] = ['safe', 'gamble', 'mine', 'fake'];

const LEVEL_COLORS: Record<RiskLevel, {
  border: string;
  text: string;
  glowColor: string;
}> = {
  safe: {
    border: 'border-safe',
    text: 'text-safe',
    glowColor: 'rgba(0, 255, 136, 0.5)',
  },
  gamble: {
    border: 'border-gamble',
    text: 'text-gamble',
    glowColor: 'rgba(255, 215, 0, 0.5)',
  },
  mine: {
    border: 'border-mine',
    text: 'text-mine',
    glowColor: 'rgba(255, 51, 102, 0.5)',
  },
  fake: {
    border: 'border-fake',
    text: 'text-fake',
    glowColor: 'rgba(139, 92, 246, 0.5)',
  },
};

// フィルターコンテンツ（デスクトップとモバイルで共有）
function FilterContent({ onClose }: { onClose?: () => void }) {
  const shouldReduceMotion = useReducedMotion();
  const { minRating, maxSakuraRisk, setMinRating, setMaxSakuraRisk, resetFilters } = useFilterStore();

  const handleReset = () => {
    resetFilters();
    onClose?.();
  };

  return (
    <>
      <p className="text-[10px] text-gold/60 uppercase tracking-widest mb-3 font-display">
        詳細フィルター
      </p>

      {/* リスクレベル凡例 */}
      <div className="mb-4 pb-3 border-b border-white/10">
        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Risk Level</p>
        <div className="space-y-1.5">
          {RISK_LEVELS.map((level) => {
            const colors = LEVEL_COLORS[level];
            return (
              <div key={level} className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center
                    border border-dashed text-[10px] font-score font-bold
                    ${colors.border} ${colors.text} bg-casino-black/80`}
                  style={{ boxShadow: `0 0 4px ${colors.glowColor}` }}
                >
                  {RISK_LEVEL_ICONS[level]}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-medium ${colors.text}`}>
                    {RISK_LEVEL_LABELS[level]}
                  </span>
                  <p className="text-[9px] text-white/40 truncate">
                    {RISK_LEVEL_DESCRIPTIONS[level]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 最低評価スライダー */}
      <div className="mb-4">
        <label className="text-xs text-white/50 block mb-2">
          最低評価: <span className="text-gold font-score">{minRating.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={minRating}
          onChange={(e) => setMinRating(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${(minRating / 5) * 100}%, #1a1f2e ${(minRating / 5) * 100}%, #1a1f2e 100%)`,
          }}
        />
      </div>

      {/* サクラリスクスライダー */}
      <div className="mb-4">
        <label className="text-xs text-white/50 block mb-2">
          最大サクラリスク: <span className="text-fake font-score">{maxSakuraRisk}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={maxSakuraRisk}
          onChange={(e) => setMaxSakuraRisk(parseInt(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${maxSakuraRisk}%, #1a1f2e ${maxSakuraRisk}%, #1a1f2e 100%)`,
          }}
        />
      </div>

      {/* リセットボタン */}
      <motion.button
        onClick={handleReset}
        className="w-full py-2 text-xs text-white/50 hover:text-gold border border-white/10 hover:border-gold/30 rounded-lg transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        リセット
      </motion.button>
    </>
  );
}

// モバイル用ボタン（左サイドコントロール）
function FilterButton({ onClick }: { onClick: () => void }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      className="absolute top-[292px] left-2 z-30 w-10 h-10 rounded-full bg-casino-velvet/90 backdrop-blur-sm border border-gold/30 text-gold flex items-center justify-center"
      initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(255,215,0,0.2)' }}
    >
      <span className="text-base">⚙️</span>
    </motion.button>
  );
}

// モバイル用ボトムシート
function FilterSheet({ onClose }: { onClose: () => void }) {
  const shouldReduceMotion = useReducedMotion();
  const dragControls = useDragControls();

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <>
      {/* オーバーレイ */}
      <motion.div
        className="fixed inset-0 bg-black/60 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* シート */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-casino-velvet/95 backdrop-blur-md rounded-t-3xl border-t border-gold/20 safe-area-bottom"
        initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
        animate={{ y: 0, opacity: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}
      >
        {/* ドラッグハンドル */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>

        {/* コンテンツ */}
        <div className="px-6 pb-6">
          <FilterContent onClose={onClose} />
        </div>
      </motion.div>
    </>
  );
}

export function DetailedFilterPanel() {
  const shouldReduceMotion = useReducedMotion();
  const { isMobile } = useBreakpoint();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // モバイル: 左サイドボタン + ボトムシート
  if (isMobile) {
    return (
      <>
        <FilterButton onClick={() => setIsSheetOpen(true)} />
        <AnimatePresence>
          {isSheetOpen && <FilterSheet onClose={() => setIsSheetOpen(false)} />}
        </AnimatePresence>
      </>
    );
  }

  // デスクトップ: 従来のサイドパネル
  return (
    <div className="absolute top-20 right-4 z-30 pointer-events-none">
      <motion.div
        className="pointer-events-auto bg-casino-velvet/95 backdrop-blur-sm rounded-2xl p-4 border border-gold/20 w-56"
        initial={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
      >
        <FilterContent />
      </motion.div>
    </div>
  );
}
