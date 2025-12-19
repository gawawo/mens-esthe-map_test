import type { RiskLevel } from './shop';

// キャラクターの表情/状態
export type CharacterMood =
  | 'idle'        // 待機中
  | 'thinking'    // 考え中
  | 'searching'   // 検索中
  | 'excited'     // 興奮 (安全店発見)
  | 'cautious'    // 警戒 (ギャンブル店)
  | 'warning'     // 警告 (危険店)
  | 'suspicious'  // 疑念 (サクラ疑惑)
  | 'celebrating' // 祝福
  | 'greeting';   // 挨拶

// 表情設定
export interface MoodConfig {
  emoji: string;
  label: string;
  animation: 'bounce' | 'pulse' | 'shake' | 'spin' | 'float' | 'none';
  glowColor: string;
}

// キャラクター状態
export interface CharacterState {
  mood: CharacterMood;
  message: string;
  isTyping: boolean;
  showParticles: boolean;
}

// リスクレベル別リアクション
export interface RiskReaction {
  mood: CharacterMood;
  messages: string[];
  celebrationType?: 'confetti' | 'coin' | 'sparkle' | 'jackpot' | 'none';
}

// 表情設定マップ
export const MOOD_CONFIGS: Record<CharacterMood, MoodConfig> = {
  idle: {
    emoji: '🔮',
    label: '待機中',
    animation: 'float',
    glowColor: 'rgba(139, 92, 246, 0.5)',
  },
  thinking: {
    emoji: '🎴',
    label: '考え中',
    animation: 'pulse',
    glowColor: 'rgba(255, 215, 0, 0.5)',
  },
  searching: {
    emoji: '🔮',
    label: '占い中',
    animation: 'spin',
    glowColor: 'rgba(139, 92, 246, 0.8)',
  },
  excited: {
    emoji: '✨',
    label: '大吉！',
    animation: 'bounce',
    glowColor: 'rgba(0, 255, 136, 0.6)',
  },
  cautious: {
    emoji: '🎲',
    label: '半吉',
    animation: 'pulse',
    glowColor: 'rgba(255, 215, 0, 0.6)',
  },
  warning: {
    emoji: '⚠️',
    label: '凶',
    animation: 'shake',
    glowColor: 'rgba(255, 51, 102, 0.6)',
  },
  suspicious: {
    emoji: '👻',
    label: 'サクラ注意',
    animation: 'pulse',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  celebrating: {
    emoji: '🎉',
    label: '大当たり！',
    animation: 'bounce',
    glowColor: 'rgba(255, 215, 0, 0.8)',
  },
  greeting: {
    emoji: '🃏',
    label: 'ようこそ',
    animation: 'bounce',
    glowColor: 'rgba(255, 215, 0, 0.5)',
  },
};

// リスクレベル別リアクション
export const RISK_REACTIONS: Record<RiskLevel, RiskReaction> = {
  safe: {
    mood: 'excited',
    messages: [
      '大吉！安心してください✨',
      'こちらは安全な店舗です！',
      'Lucky の占いは大当たり！',
      '素晴らしい選択です！',
    ],
    celebrationType: 'confetti',
  },
  gamble: {
    mood: 'cautious',
    messages: [
      '半吉...慎重に🎲',
      '賭けの要素がありますね',
      '運次第かもしれません',
      '口コミをよく確認してください',
    ],
    celebrationType: 'none',
  },
  mine: {
    mood: 'warning',
    messages: [
      '凶...要注意です💣',
      '危険な兆候を感じます',
      '別の店舗をお勧めします',
      '注意が必要です！',
    ],
    celebrationType: 'none',
  },
  fake: {
    mood: 'suspicious',
    messages: [
      'サクラの影を感じます👻',
      'レビューに不自然さがあります',
      '要注意...何かが怪しい',
      '本物かどうか疑わしいです',
    ],
    celebrationType: 'none',
  },
};
