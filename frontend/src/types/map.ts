/**
 * マップ関連の型定義
 */

import type { RiskLevel } from './shop';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapCenter {
  lat: number;
  lng: number;
}

export type FilterMode = 'all' | 'safe-first' | 'gambler' | 'minefield';

export interface FilterState {
  mode: FilterMode;
  minRating?: number;
  maxSakuraRisk?: number;
  riskLevels: RiskLevel[];
}

export const FILTER_MODE_CONFIG: Record<FilterMode, {
  label: string;
  description: string;
  includedRiskLevels: RiskLevel[];
}> = {
  all: {
    label: '全表示',
    description: 'すべての店舗を表示',
    includedRiskLevels: ['safe', 'gamble', 'mine', 'fake'],
  },
  'safe-first': {
    label: '安全第一',
    description: '地雷・サクラ疑惑店を除外',
    includedRiskLevels: ['safe', 'gamble'],
  },
  gambler: {
    label: 'ギャンブラー',
    description: '賛否両論の店舗のみ',
    includedRiskLevels: ['gamble'],
  },
  minefield: {
    label: '地雷原',
    description: '低評価店舗のみ表示',
    includedRiskLevels: ['mine'],
  },
};

export interface MarkerStyle {
  backgroundColor: string;
  borderColor: string;
  icon: string;
  opacity: number;
}

export const RISK_LEVEL_STYLES: Record<RiskLevel, MarkerStyle> = {
  safe: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
    icon: '✓',
    opacity: 1,
  },
  gamble: {
    backgroundColor: '#eab308',
    borderColor: '#ca8a04',
    icon: '🎲',
    opacity: 1,
  },
  mine: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
    icon: '💣',
    opacity: 1,
  },
  fake: {
    backgroundColor: '#9ca3af',
    borderColor: '#6b7280',
    icon: '👻',
    opacity: 0.5,
  },
};
