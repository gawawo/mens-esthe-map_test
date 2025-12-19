'use client';

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import type { Shop, RiskLevel } from '@/types';
import { RiskBadge } from './RiskBadge';

interface ShopCardProps {
  shop: Shop;
  onClick?: () => void;
  isSelected?: boolean;
}

// リスクレベル別のグローカラー
const GLOW_COLORS: Record<RiskLevel, string> = {
  safe: 'rgba(0, 255, 136, 0.3)',
  gamble: 'rgba(255, 215, 0, 0.3)',
  mine: 'rgba(255, 51, 102, 0.3)',
  fake: 'rgba(139, 92, 246, 0.3)',
};

// リスクレベル別のボーダーカラー
const BORDER_COLORS: Record<RiskLevel, string> = {
  safe: 'border-safe/30 hover:border-safe/50',
  gamble: 'border-gamble/30 hover:border-gamble/50',
  mine: 'border-mine/30 hover:border-mine/50',
  fake: 'border-fake/30 hover:border-fake/50',
};

export function ShopCard({ shop, onClick, isSelected }: ShopCardProps) {
  const { analytics } = shop;
  const riskLevel = analytics?.risk_level ?? 'gamble';
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // マウス位置トラッキング
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-8, 8]);

  const glowX = useTransform(mouseXSpring, [-0.5, 0.5], ['20%', '80%']);
  const glowY = useTransform(mouseYSpring, [-0.5, 0.5], ['20%', '80%']);

  // 平均スコアを計算
  const avgScore = analytics
    ? (
        analytics.score_operation +
        analytics.score_accuracy +
        analytics.score_hygiene +
        analytics.score_sincerity +
        analytics.score_safety
      ) / 5
    : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // 警告アニメーション (mine の場合)
  const warningAnimation = riskLevel === 'mine' && !shouldReduceMotion
    ? {
        x: [0, -2, 2, -2, 0],
        transition: { duration: 0.4, repeat: Infinity, repeatDelay: 3 },
      }
    : undefined;

  const cardStyle = shouldReduceMotion
    ? {}
    : {
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d' as const,
      };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`
        relative p-4 rounded-card cursor-pointer overflow-hidden
        bg-casino-velvet border transition-colors duration-300
        ${BORDER_COLORS[riskLevel]}
        ${isSelected
          ? 'ring-2 ring-gold border-gold/50'
          : ''
        }
      `}
      style={cardStyle}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, ...(warningAnimation || {}) }}
      transition={{ duration: 0.3 }}
    >
      {/* グローエフェクト */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-card"
          style={{
            background: `radial-gradient(circle at ${glowX} ${glowY}, ${GLOW_COLORS[riskLevel]}, transparent 60%)`,
            opacity: 0.6,
          }}
        />
      )}

      {/* カードコンテンツ */}
      <div className="relative z-10">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg text-white line-clamp-1 tracking-wide">
            {shop.name}
          </h3>
          {analytics && (
            <RiskBadge
              level={analytics.risk_level}
              size="sm"
              showLabel={false}
              animated={!shouldReduceMotion}
            />
          )}
        </div>

        {/* 住所 */}
        {shop.formatted_address && (
          <p className="mt-1 text-sm text-white/50 line-clamp-1 font-body">
            {shop.formatted_address}
          </p>
        )}

        {/* スコア情報 */}
        <div className="mt-3 flex items-center gap-4 flex-wrap">
          {/* Google評価 */}
          {shop.rating && (
            <div className="flex items-center gap-1">
              <motion.span
                className="text-gold"
                animate={!shouldReduceMotion ? { scale: [1, 1.1, 1] } : undefined}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ★
              </motion.span>
              <span className="text-sm font-score font-medium text-white">
                {shop.rating.toFixed(1)}
              </span>
              {shop.user_ratings_total && (
                <span className="text-xs text-white/40">
                  ({shop.user_ratings_total})
                </span>
              )}
            </div>
          )}

          {/* AI平均スコア */}
          {avgScore !== null && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-neon-cyan">AI</span>
              <span className="text-sm font-score font-medium text-white">
                {avgScore.toFixed(1)}
              </span>
              <span className="text-xs text-white/40">/10</span>
            </div>
          )}

          {/* サクラリスク */}
          {analytics && analytics.sakura_risk > 30 && (
            <motion.div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-fake/20 border border-fake/30"
              animate={!shouldReduceMotion ? { opacity: [0.7, 0.4, 0.7] } : undefined}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs">👻</span>
              <span className="text-xs text-fake font-medium">
                {analytics.sakura_risk}%
              </span>
            </motion.div>
          )}
        </div>

        {/* リスクサマリー */}
        {analytics?.risk_summary && (
          <p className="mt-3 text-xs text-white/60 line-clamp-2 font-body leading-relaxed">
            {analytics.risk_summary}
          </p>
        )}
      </div>

      {/* 選択時のゴールドアクセント */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-card pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)',
          }}
        />
      )}

      {/* 危険店舗のフラッシュ警告 */}
      {riskLevel === 'mine' && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-card pointer-events-none border-2 border-mine/0"
          animate={{
            borderColor: ['rgba(255,51,102,0)', 'rgba(255,51,102,0.5)', 'rgba(255,51,102,0)'],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
