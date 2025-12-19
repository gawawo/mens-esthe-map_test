/**
 * アプリケーション定数
 */

// マップのデフォルト設定（新宿を中心に設定）
export const DEFAULT_MAP_CENTER = {
  lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT || '35.6938'),
  lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG || '139.7034'),
};

export const DEFAULT_MAP_ZOOM = parseInt(
  process.env.NEXT_PUBLIC_DEFAULT_ZOOM || '14',
  10
);

// エリア定義（東京主要エリア）
export const TOKYO_AREAS = [
  { key: 'shinjuku', name: '新宿', lat: 35.6938, lng: 139.7034 },
  { key: 'shibuya', name: '渋谷', lat: 35.658, lng: 139.7016 },
  { key: 'ikebukuro', name: '池袋', lat: 35.7295, lng: 139.7109 },
  { key: 'ueno', name: '上野', lat: 35.7141, lng: 139.7774 },
  { key: 'akihabara', name: '秋葉原', lat: 35.6984, lng: 139.7731 },
] as const;

// リスクレベル表示名
export const RISK_LEVEL_LABELS = {
  safe: '安全',
  gamble: '賛否両論',
  mine: '要注意',
  fake: 'サクラ疑惑',
} as const;

// リスクレベルアイコン（カジノチップ風）
export const RISK_LEVEL_ICONS = {
  safe: '★',    // 星：安全・おすすめ
  gamble: '?',  // ?：評価が分かれる
  mine: '!',    // !：警告・注意
  fake: '👻',   // ゴースト：サクラ疑惑
} as const;

// リスクレベル説明文
export const RISK_LEVEL_DESCRIPTIONS = {
  safe: '高評価で信頼できる店舗',
  gamble: '評価にばらつきがある店舗',
  mine: 'レビューで問題が指摘された店舗',
  fake: '不自然なレビューが多い店舗',
} as const;

// スコア表示名
export const SCORE_LABELS = {
  score_operation: '運営',
  score_accuracy: '正確性',
  score_hygiene: '衛生',
  score_sincerity: '誠実さ',
  score_safety: '安全性',
} as const;

// 価格レベル表示
export const PRICE_LEVEL_LABELS = ['無料', '安い', '普通', '高い', 'とても高い'];
