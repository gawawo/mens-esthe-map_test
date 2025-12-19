/**
 * 解析結果関連の型定義
 */

import type { RiskLevel } from './shop';

export interface AnalyticsResponse {
  shop_id: string;
  score_operation: number;
  score_accuracy: number;
  score_hygiene: number;
  score_sincerity: number;
  score_safety: number;
  variance_score: number;
  sakura_risk: number;
  risk_level: RiskLevel;
  risk_summary?: string;
  positive_points?: string[];
  negative_points?: string[];
  analyzed_review_count?: number;
  analysis_version?: string;
  last_analyzed_at: string;
}

export interface RiskSummary {
  summary: {
    risk_level: RiskLevel;
    count: number;
  }[];
  total: number;
}
