'use client';

import { motion } from 'framer-motion';
import { useFilterStore } from '@/stores/filterStore';
import { FilterModeSelector } from './FilterModeSelector';
import { AreaSelector } from './AreaSelector';
import { RiskLevelFilter } from './RiskLevelFilter';

export function FilterPanel() {
  const { minRating, maxSakuraRisk, setMinRating, setMaxSakuraRisk, resetFilters } =
    useFilterStore();

  return (
    <div className="p-4 space-y-4 border-b border-gold/10 overflow-y-auto max-h-[50vh]">
      {/* エリア選択 */}
      <AreaSelector />

      {/* フィルターモード */}
      <FilterModeSelector />

      {/* リスクレベルフィルター */}
      <RiskLevelFilter />

      {/* 詳細フィルター */}
      <div className="space-y-3">
        <h3 className="text-sm font-display tracking-wide text-gold/80">詳細フィルター</h3>

        {/* 最低評価 */}
        <div>
          <label className="text-xs text-white/50 block mb-2">
            最低Google評価: <span className="text-gold font-score">{minRating.toFixed(1)}</span>
          </label>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-full h-2 bg-casino-felt rounded-lg appearance-none cursor-pointer accent-gold"
              style={{
                background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${(minRating / 5) * 100}%, #1a1f2e ${(minRating / 5) * 100}%, #1a1f2e 100%)`,
              }}
            />
          </div>
        </div>

        {/* 最大サクラリスク */}
        <div>
          <label className="text-xs text-white/50 block mb-2">
            最大サクラリスク: <span className="text-fake font-score">{maxSakuraRisk}%</span>
          </label>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={maxSakuraRisk}
              onChange={(e) => setMaxSakuraRisk(parseInt(e.target.value))}
              className="w-full h-2 bg-casino-felt rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${maxSakuraRisk}%, #1a1f2e ${maxSakuraRisk}%, #1a1f2e 100%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* リセットボタン */}
      <motion.button
        onClick={resetFilters}
        className="w-full py-2.5 text-sm text-white/50 hover:text-gold border border-white/10 hover:border-gold/30 rounded-lg transition-colors bg-casino-black/30"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        フィルターをリセット
      </motion.button>
    </div>
  );
}
