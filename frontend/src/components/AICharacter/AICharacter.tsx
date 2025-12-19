'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCharacterStore } from '@/stores/characterStore';
import { useMapStore } from '@/stores/mapStore';
import { CharacterAvatar } from './CharacterAvatar';
import { SpeechBubble, TypingIndicator } from './SpeechBubble';
import { ParticleEffects, LuckySparkle } from './ParticleEffects';
import { MOOD_CONFIGS } from '@/types/character';
import { AIChat } from '@/components/Search/AIChat';

interface AICharacterProps {
  compact?: boolean;
  showMessage?: boolean;
  className?: string;
  onShopSelect?: (shopId: string) => void;
}

export function AICharacter({
  compact = false,
  showMessage = true,
  className = '',
  onShopSelect,
}: AICharacterProps) {
  const { mood, message, isTyping, showParticles, resetToIdle } = useCharacterStore();
  const { layout, toggleAIChat } = useMapStore();
  const shouldReduceMotion = useReducedMotion();
  const config = MOOD_CONFIGS[mood];

  if (compact) {
    return (
      <div className={`relative inline-flex items-center gap-2 ${className}`}>
        <CharacterAvatar mood={mood} size="sm" onClick={resetToIdle} />
        <span className="text-sm text-gold/80 font-medium">{config.label}</span>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative flex items-start gap-3 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* パーティクルエフェクト */}
      <ParticleEffects mood={mood} isActive={showParticles} />

      {/* アバター */}
      <div className="relative flex-shrink-0">
        <CharacterAvatar mood={mood} size="md" onClick={resetToIdle} />
        <LuckySparkle intensity={0.5} />
      </div>

      {/* メッセージ */}
      {showMessage && (
        <div className="flex-1 min-w-0">
          <SpeechBubble variant="ai">
            {isTyping ? (
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">{config.label}</span>
                <TypingIndicator />
              </div>
            ) : (
              <motion.p
                className="text-sm text-white leading-relaxed"
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {message}
              </motion.p>
            )}
          </SpeechBubble>

          {/* 状態ラベル */}
          <motion.div
            className="mt-1 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{
                borderColor: config.glowColor,
                color: config.glowColor,
                backgroundColor: `${config.glowColor}10`,
              }}
            >
              {config.label}
            </span>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// マップオーバーレイ用の展開/縮小可能なAIキャラクター
export function AICharacterOverlay({ onShopSelect }: { onShopSelect?: (shopId: string) => void }) {
  const { mood } = useCharacterStore();
  const { layout, toggleAIChat } = useMapStore();
  const shouldReduceMotion = useReducedMotion();
  const config = MOOD_CONFIGS[mood];

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-4 z-30 pointer-events-none">
      {/* 縮小時：アバターのみ */}
      <AnimatePresence mode="wait">
        {!layout.isAIChatExpanded ? (
          <motion.button
            key="collapsed"
            onClick={toggleAIChat}
            className="relative pointer-events-auto"
            initial={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center bg-casino-velvet border-2 border-gold/30"
              style={{
                boxShadow: `0 0 20px ${config.glowColor}, 0 4px 20px rgba(0,0,0,0.5)`,
              }}
            >
              <span className="text-2xl">{config.emoji}</span>
            </div>
            {/* パルスエフェクト */}
            {!shouldReduceMotion && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-gold/30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            {/* 状態ラベル */}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs whitespace-nowrap"
              style={{
                backgroundColor: `${config.glowColor}20`,
                color: config.glowColor,
                border: `1px solid ${config.glowColor}40`,
              }}
            >
              {config.label}
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            className="w-80 pointer-events-auto"
            initial={shouldReduceMotion ? {} : { scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div
              className="bg-casino-velvet/95 backdrop-blur-sm rounded-2xl border border-gold/20 overflow-hidden"
              style={{
                boxShadow: '0 4px 30px rgba(0,0,0,0.6), 0 0 1px rgba(255,215,0,0.3)',
              }}
            >
              {/* ヘッダー */}
              <div className="px-4 py-3 border-b border-gold/20 bg-casino-midnight/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CharacterAvatar mood={mood} size="sm" />
                  <div>
                    <h2 className="text-sm font-display text-gold tracking-wide">
                      Lucky の占い検索
                    </h2>
                    <p className="text-xs text-white/50">{config.label}</p>
                  </div>
                </div>
                <motion.button
                  onClick={toggleAIChat}
                  className="w-8 h-8 rounded-full bg-casino-black/50 border border-white/10 flex items-center justify-center text-white/50 hover:text-gold hover:border-gold/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>
              </div>

              {/* チャット本体 */}
              <AIChat onShopSelect={onShopSelect} className="h-96" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ヘッダー用コンパクトキャラクター
export function AICharacterHeader() {
  const { mood } = useCharacterStore();
  const config = MOOD_CONFIGS[mood];

  return (
    <div className="flex items-center gap-2">
      <CharacterAvatar mood={mood} size="sm" />
      <div>
        <h2 className="text-lg font-display text-gold tracking-wide">
          Lucky の占い検索
        </h2>
        <p className="text-xs text-white/50">
          {config.label}
        </p>
      </div>
    </div>
  );
}
