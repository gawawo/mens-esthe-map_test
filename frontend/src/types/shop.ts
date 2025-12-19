/**
 * 店舗関連の型定義
 */

export interface Location {
  lat: number;
  lng: number;
}

export interface ShopAnalytics {
  risk_level: RiskLevel;
  score_operation: number;
  score_accuracy: number;
  score_hygiene: number;
  score_sincerity: number;
  score_safety: number;
  variance_score: number;
  sakura_risk: number;
  risk_summary?: string;
  positive_points?: string[];
  negative_points?: string[];
}

export type RiskLevel = 'safe' | 'gamble' | 'mine' | 'fake';

export interface Shop {
  id: string;
  place_id: string;
  name: string;
  formatted_address?: string;
  location: Location;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  business_status?: string;
  opening_hours?: Record<string, unknown>;
  phone_number?: string;
  website?: string;
  created_at: string;
  updated_at: string;
  last_fetched_at?: string;
  analytics?: ShopAnalytics;
}

export interface ShopListResponse {
  shops: Shop[];
  total: number;
  page: number;
  per_page: number;
}

export interface Review {
  id: string;
  shop_id: string;
  author_name?: string;
  rating?: number;
  text?: string;
  text_ja?: string;  // 日本語翻訳テキスト
  language?: string;  // 元の言語コード
  relative_time_description?: string;
  created_at: string;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
}

// ============================================
// Search Types
// ============================================

export interface ChatSearchRequest {
  query: string;
  limit?: number;
}

export interface SearchResultItem {
  shop_id: string;
  shop_name: string;
  relevance_score: number;
  matched_reviews: MatchedReview[];
  analytics?: SearchResultAnalytics;
}

export interface MatchedReview {
  text: string;
  rating?: number;
  similarity: number;
}

export interface SearchResultAnalytics {
  risk_level: RiskLevel;
  score_operation?: number;
  score_accuracy?: number;
  score_hygiene?: number;
  score_sincerity?: number;
  score_safety?: number;
  sakura_risk?: number;
  risk_summary?: string;
}

export interface ChatSearchResponse {
  query: string;
  answer: string;
  results: SearchResultItem[];
  total_results: number;
}

export interface EmbeddingStatus {
  total_reviews: number;
  embedded_reviews: number;
  pending_reviews: number;
  embedding_rate: number;
}
