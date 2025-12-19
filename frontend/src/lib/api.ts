/**
 * Backend APIクライアント
 */

import type {
  Shop,
  ShopListResponse,
  ReviewListResponse,
  RiskLevel,
  ChatSearchRequest,
  ChatSearchResponse,
  EmbeddingStatus,
} from '@/types';
import type { AnalyticsResponse, RiskSummary } from '@/types/analytics';

const API_BASE_URL = '/api/v1';

class APIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      response.status,
      error.detail || `API Error: ${response.status}`
    );
  }

  return response.json();
}

// ============================================
// Shops API
// ============================================

export interface GetShopsParams {
  page?: number;
  per_page?: number;
  risk_level?: RiskLevel;
  min_rating?: number;
}

export async function getShops(params: GetShopsParams = {}): Promise<ShopListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.per_page) searchParams.set('per_page', String(params.per_page));
  if (params.risk_level) searchParams.set('risk_level', params.risk_level);
  if (params.min_rating) searchParams.set('min_rating', String(params.min_rating));

  const query = searchParams.toString();
  return fetchAPI<ShopListResponse>(`/shops${query ? `?${query}` : ''}`);
}

export interface GetNearbyShopsParams {
  lat: number;
  lng: number;
  radius?: number;
  limit?: number;
  risk_level?: RiskLevel;
}

export async function getNearbyShops(params: GetNearbyShopsParams): Promise<Shop[]> {
  const searchParams = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
  });

  if (params.radius) searchParams.set('radius', String(params.radius));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.risk_level) searchParams.set('risk_level', params.risk_level);

  return fetchAPI<Shop[]>(`/shops/nearby?${searchParams.toString()}`);
}

export async function getShop(shopId: string): Promise<Shop> {
  return fetchAPI<Shop>(`/shops/${shopId}`);
}

export async function getShopReviews(shopId: string, limit = 50): Promise<ReviewListResponse> {
  return fetchAPI<ReviewListResponse>(`/shops/${shopId}/reviews?limit=${limit}`);
}

// ============================================
// Analytics API
// ============================================

export async function getShopAnalytics(shopId: string): Promise<AnalyticsResponse> {
  return fetchAPI<AnalyticsResponse>(`/analytics/shop/${shopId}`);
}

export async function getRiskSummary(riskLevel?: RiskLevel): Promise<RiskSummary> {
  const query = riskLevel ? `?risk_level=${riskLevel}` : '';
  return fetchAPI<RiskSummary>(`/analytics/risk-summary${query}`);
}

export async function getUnanalyzedShops(limit = 50): Promise<{
  count: number;
  shops: { id: string; name: string; place_id: string }[];
}> {
  return fetchAPI(`/analytics/unanalyzed?limit=${limit}`);
}

// ============================================
// Ingestion API
// ============================================

export async function getAvailableAreas(): Promise<Record<string, {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}>> {
  return fetchAPI('/ingestion/areas');
}

export async function runIngestion(params: {
  area_key?: string;
  custom_area?: {
    name: string;
    latitude: number;
    longitude: number;
    radius?: number;
  };
  fetch_reviews?: boolean;
}): Promise<{
  area_name: string;
  shops_found: number;
  shops_created: number;
  shops_updated: number;
  reviews_created: number;
  errors: string[];
}> {
  return fetchAPI('/ingestion/run', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ============================================
// Analysis API
// ============================================

export async function analyzeShop(shopId: string, force = false): Promise<AnalyticsResponse> {
  return fetchAPI(`/analytics/analyze/shop/${shopId}?force=${force}`, {
    method: 'POST',
  });
}

export async function analyzeBatch(params: {
  shop_ids?: string[];
  limit?: number;
  force?: boolean;
}): Promise<{
  status: string;
  message: string;
  total_shops: number;
  analyzed: number;
  skipped: number;
  failed: number;
}> {
  return fetchAPI('/analytics/analyze/batch', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ============================================
// Search API
// ============================================

export async function chatSearch(request: ChatSearchRequest): Promise<ChatSearchResponse> {
  return fetchAPI<ChatSearchResponse>('/search/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function vectorSearch(query: string, limit = 10): Promise<{
  query: string;
  results: Array<{
    review_id: string;
    shop_id: string;
    review_text: string;
    rating?: number;
    shop_name: string;
    formatted_address?: string;
    similarity: number;
  }>;
  total: number;
}> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
  });
  return fetchAPI(`/search/vector?${params.toString()}`);
}

export interface StructuredSearchParams {
  min_score?: number;
  max_sakura_risk?: number;
  risk_levels?: string;
  min_rating?: number;
  limit?: number;
}

export async function structuredSearch(params: StructuredSearchParams): Promise<{
  results: Shop[];
  total: number;
  filters: StructuredSearchParams;
}> {
  const searchParams = new URLSearchParams();

  if (params.min_score !== undefined) searchParams.set('min_score', String(params.min_score));
  if (params.max_sakura_risk !== undefined) searchParams.set('max_sakura_risk', String(params.max_sakura_risk));
  if (params.risk_levels) searchParams.set('risk_levels', params.risk_levels);
  if (params.min_rating !== undefined) searchParams.set('min_rating', String(params.min_rating));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  return fetchAPI(`/search/structured${query ? `?${query}` : ''}`);
}

export async function getEmbeddingStatus(): Promise<EmbeddingStatus> {
  return fetchAPI<EmbeddingStatus>('/search/embeddings/status');
}

export async function generateEmbeddings(limit = 100): Promise<{
  total_reviews: number;
  embedded: number;
  skipped: number;
  failed: number;
  errors: string[];
}> {
  return fetchAPI('/search/embeddings/generate', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  });
}

// ============================================
// Ranking API
// ============================================

export interface ShopRankingParams {
  area?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
  sort_by?: 'avg_score' | 'score_safety' | 'score_accuracy';
}

export interface RankingItem {
  rank: number;
  shop: Shop;
  avg_score: number;
}

export interface ShopRankingResponse {
  area: string | null;
  total: number;
  ranking: RankingItem[];
}

export async function getShopRanking(params: ShopRankingParams): Promise<ShopRankingResponse> {
  const searchParams = new URLSearchParams();

  if (params.area) searchParams.set('area', params.area);
  if (params.lat !== undefined) searchParams.set('lat', String(params.lat));
  if (params.lng !== undefined) searchParams.set('lng', String(params.lng));
  if (params.radius !== undefined) searchParams.set('radius', String(params.radius));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);

  return fetchAPI<ShopRankingResponse>(`/shops/ranking?${searchParams.toString()}`);
}
