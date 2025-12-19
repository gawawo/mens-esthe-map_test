'use client';

import { useFilterStore } from '@/stores/filterStore';
import type { FilterMode, RiskLevel } from '@/types';
import { FILTER_MODE_CONFIG } from '@/types/map';

export function useFilter() {
  const {
    mode,
    minRating,
    maxSakuraRisk,
    selectedRiskLevels,
    setMode,
    setMinRating,
    setMaxSakuraRisk,
    toggleRiskLevel,
    resetFilters,
    isShopVisible,
  } = useFilterStore();

  // 現在のモード設定を取得
  const currentModeConfig = FILTER_MODE_CONFIG[mode];

  // フィルターが適用されているかどうか
  const hasActiveFilters =
    mode !== 'all' ||
    minRating > 0 ||
    maxSakuraRisk < 100 ||
    selectedRiskLevels.length < 4;

  return {
    // 状態
    mode,
    minRating,
    maxSakuraRisk,
    selectedRiskLevels,
    currentModeConfig,
    hasActiveFilters,

    // アクション
    setMode,
    setMinRating,
    setMaxSakuraRisk,
    toggleRiskLevel,
    resetFilters,
    isShopVisible,
  };
}
