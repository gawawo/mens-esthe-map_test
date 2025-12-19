/**
 * フィルター状態の管理
 */

import { create } from 'zustand';
import type { FilterMode, RiskLevel } from '@/types';
import { FILTER_MODE_CONFIG } from '@/types/map';

interface FilterState {
  // フィルター設定
  mode: FilterMode;
  minRating: number;
  maxSakuraRisk: number;
  selectedRiskLevels: RiskLevel[];

  // アクション
  setMode: (mode: FilterMode) => void;
  setMinRating: (rating: number) => void;
  setMaxSakuraRisk: (risk: number) => void;
  toggleRiskLevel: (level: RiskLevel) => void;
  resetFilters: () => void;

  // ヘルパー
  isShopVisible: (analytics?: {
    risk_level?: RiskLevel;
    sakura_risk?: number;
  }, rating?: number) => boolean;
}

const DEFAULT_STATE = {
  mode: 'all' as FilterMode,
  minRating: 0,
  maxSakuraRisk: 100,
  selectedRiskLevels: ['safe', 'gamble', 'mine', 'fake'] as RiskLevel[],
};

export const useFilterStore = create<FilterState>((set, get) => ({
  ...DEFAULT_STATE,

  // フィルターモードを設定
  setMode: (mode) => {
    const config = FILTER_MODE_CONFIG[mode];
    set({
      mode,
      selectedRiskLevels: config.includedRiskLevels,
    });
  },

  // 最低評価を設定
  setMinRating: (rating) => {
    set({ minRating: rating });
  },

  // 最大サクラリスクを設定
  setMaxSakuraRisk: (risk) => {
    set({ maxSakuraRisk: risk });
  },

  // リスクレベルをトグル
  toggleRiskLevel: (level) => {
    const { selectedRiskLevels } = get();
    const isSelected = selectedRiskLevels.includes(level);

    if (isSelected) {
      // 最低1つは選択状態を維持
      if (selectedRiskLevels.length > 1) {
        set({
          selectedRiskLevels: selectedRiskLevels.filter((l) => l !== level),
          mode: 'all', // カスタムモードに切り替え
        });
      }
    } else {
      set({
        selectedRiskLevels: [...selectedRiskLevels, level],
        mode: 'all',
      });
    }
  },

  // フィルターをリセット
  resetFilters: () => {
    set(DEFAULT_STATE);
  },

  // 店舗がフィルター条件に合致するか判定
  isShopVisible: (analytics, rating) => {
    const { selectedRiskLevels, minRating, maxSakuraRisk } = get();

    // 解析結果がない場合は表示
    if (!analytics) {
      return true;
    }

    // リスクレベルチェック
    if (analytics.risk_level && !selectedRiskLevels.includes(analytics.risk_level)) {
      return false;
    }

    // サクラリスクチェック
    if (analytics.sakura_risk !== undefined && analytics.sakura_risk > maxSakuraRisk) {
      return false;
    }

    // 評価チェック
    if (rating !== undefined && rating < minRating) {
      return false;
    }

    return true;
  },
}));
