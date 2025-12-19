'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, useDragControls, PanInfo } from 'framer-motion';
import { useShopStore } from '@/stores/shopStore';
import { useMapStore } from '@/stores/mapStore';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { RiskBadge } from './RiskBadge';
import { RadarChart } from './RadarChart';
import { SCORE_LABELS } from '@/lib/constants';
import { getShopReviews } from '@/lib/api';
import type { RiskLevel, Review } from '@/types';

// リスクレベル別のアクセントカラー
const RISK_ACCENT_COLORS: Record<RiskLevel, string> = {
  safe: 'border-safe/30',
  gamble: 'border-gamble/30',
  mine: 'border-mine/30',
  fake: 'border-fake/30',
};

export function ShopDetailPanel() {
  const { selectedShop, selectShop } = useShopStore();
  const { layout, setDetailPanelOpen } = useMapStore();
  const shouldReduceMotion = useReducedMotion();
  const { isMobile } = useBreakpoint();
  const dragControls = useDragControls();

  // レビュー表示用state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // 店舗が変わったらレビューを取得
  useEffect(() => {
    if (selectedShop?.id) {
      setReviewsLoading(true);
      getShopReviews(selectedShop.id)
        .then((response) => setReviews(response.reviews))
        .catch(console.error)
        .finally(() => setReviewsLoading(false));
    } else {
      setReviews([]);
    }
  }, [selectedShop?.id]);

  const handleClose = () => {
    selectShop(null);
    setDetailPanelOpen(false);
  };

  // ドラッグ終了時の処理（モバイルのみ）
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      handleClose();
    }
  };

  const { analytics } = selectedShop || {};
  const riskLevel = analytics?.risk_level ?? 'gamble';

  // レスポンシブ: アニメーション設定
  const panelVariants = {
    initial: shouldReduceMotion
      ? { opacity: 0 }
      : isMobile
        ? { y: '100%', opacity: 0 }
        : { x: '100%', opacity: 0 },
    animate: { x: 0, y: 0, opacity: 1 },
    exit: shouldReduceMotion
      ? { opacity: 0 }
      : isMobile
        ? { y: '100%', opacity: 0 }
        : { x: '100%', opacity: 0 },
  };

  // レスポンシブ: パネルのクラス
  const panelPositionClass = isMobile
    ? 'fixed bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl z-50'
    : 'absolute top-0 right-0 h-full w-96 z-40';

  return (
    <AnimatePresence>
      {selectedShop && (
        <>
          {/* モバイル用背景オーバーレイ */}
          {isMobile && (
            <motion.div
              className="fixed inset-0 bg-black/60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
          )}

          <motion.div
            className={`${panelPositionClass} pointer-events-auto`}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={
              shouldReduceMotion
                ? { duration: 0.01 }
                : { type: 'spring', stiffness: 300, damping: 30 }
            }
            drag={isMobile ? 'y' : false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            <div
              className={`h-full bg-casino-velvet/95 backdrop-blur-sm overflow-hidden flex flex-col ${
                isMobile
                  ? `rounded-t-3xl border-t ${RISK_ACCENT_COLORS[riskLevel]}`
                  : `border-l ${RISK_ACCENT_COLORS[riskLevel]}`
              }`}
              style={{
                boxShadow: isMobile
                  ? '0 -10px 40px rgba(0,0,0,0.5)'
                  : '-10px 0 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* モバイル用ドラッグハンドル */}
              {isMobile && (
                <div
                  className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="w-12 h-1 bg-white/30 rounded-full" />
                </div>
              )}
            {/* ヘッダー */}
            <div className="sticky top-0 bg-casino-midnight/80 backdrop-blur-sm px-4 py-4 border-b border-gold/10 flex items-center justify-between">
              <h2 className="font-display text-lg text-white tracking-wide line-clamp-1 flex-1 mr-2">
                {selectedShop.name}
              </h2>
              <motion.button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-casino-black/50 border border-white/10 flex items-center justify-center text-white/50 hover:text-mine hover:border-mine/30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {/* リスクバッジ */}
              {analytics && (
                <motion.div
                  className="flex items-center gap-3"
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <RiskBadge level={analytics.risk_level} size="lg" />
                  {analytics.sakura_risk > 50 && (
                    <span className="text-sm text-fake flex items-center gap-1">
                      <span>👻</span>
                      サクラ疑惑 {analytics.sakura_risk}%
                    </span>
                  )}
                </motion.div>
              )}

              {/* 基本情報 */}
              <motion.div
                className="space-y-2 p-3 rounded-xl bg-casino-black/30 border border-white/5"
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {selectedShop.formatted_address && (
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    <span className="text-gold/60">📍</span>
                    {selectedShop.formatted_address}
                  </p>
                )}
                {selectedShop.phone_number && (
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    <span className="text-gold/60">📞</span>
                    {selectedShop.phone_number}
                  </p>
                )}
                {selectedShop.website && (
                  <a
                    href={selectedShop.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-neon-cyan hover:text-neon-cyan/80 flex items-center gap-2 transition-colors"
                  >
                    <span className="text-gold/60">🔗</span>
                    ウェブサイト
                  </a>
                )}
              </motion.div>

              {/* Google評価 */}
              {selectedShop.rating && (
                <motion.div
                  className="flex items-center gap-3 p-3 rounded-xl bg-gold/5 border border-gold/10"
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.span
                    className="text-3xl text-gold"
                    animate={shouldReduceMotion ? {} : { scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ★
                  </motion.span>
                  <div>
                    <span className="text-2xl font-score font-bold text-white">
                      {selectedShop.rating.toFixed(1)}
                    </span>
                    <span className="text-white/40 text-sm ml-1">/ 5.0</span>
                    {selectedShop.user_ratings_total && (
                      <p className="text-xs text-white/40">
                        ({selectedShop.user_ratings_total}件のレビュー)
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* AI解析結果 */}
              {analytics && (
                <>
                  {/* レーダーチャート */}
                  <motion.div
                    className="flex justify-center p-2 md:p-3 rounded-xl bg-casino-black/30 border border-white/5"
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <RadarChart analytics={analytics} size={isMobile ? 180 : 200} />
                  </motion.div>

                  {/* スコア詳細 */}
                  <motion.div
                    className="space-y-2"
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-sm font-display tracking-wide text-gold/80">スコア詳細</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(SCORE_LABELS).map(([key, label]) => {
                        const score = analytics[key as keyof typeof SCORE_LABELS];
                        const percentage = (score / 10) * 100;
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between p-2 bg-casino-black/30 rounded-lg border border-white/5"
                          >
                            <span className="text-xs text-white/60">{label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-casino-felt rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gold"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ delay: 0.4, duration: 0.5 }}
                                />
                              </div>
                              <span className="text-xs font-score font-medium text-white w-6 text-right">
                                {score}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* ギャンブル度 */}
                  {analytics.variance_score > 40 && (
                    <motion.div
                      className="p-3 bg-gamble/10 rounded-xl border border-gamble/20"
                      initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <p className="text-sm font-medium text-gamble flex items-center gap-2">
                        <span>🎲</span>
                        ギャンブル度: {analytics.variance_score.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gamble/70 mt-1">
                        評価のばらつきが大きい店舗です
                      </p>
                    </motion.div>
                  )}

                  {/* リスクサマリー */}
                  {analytics.risk_summary && (
                    <motion.div
                      className="p-3 bg-casino-black/30 rounded-xl border border-white/5"
                      initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-sm font-display tracking-wide text-gold/80 mb-2">AI分析サマリー</h3>
                      <p className="text-sm text-white/70 leading-relaxed">{analytics.risk_summary}</p>
                    </motion.div>
                  )}

                  {/* 良い点・悪い点 */}
                  <motion.div
                    className="grid grid-cols-2 gap-3"
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    {/* 良い点 */}
                    {analytics.positive_points && analytics.positive_points.length > 0 && (
                      <div className="p-3 bg-safe/10 rounded-xl border border-safe/20">
                        <h4 className="text-xs font-display tracking-wide text-safe mb-2 flex items-center gap-1">
                          <span>👍</span> 良い点
                        </h4>
                        <ul className="space-y-1">
                          {analytics.positive_points.map((point, i) => (
                            <li key={i} className="text-xs text-white/60">
                              • {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 悪い点 */}
                    {analytics.negative_points && analytics.negative_points.length > 0 && (
                      <div className="p-3 bg-mine/10 rounded-xl border border-mine/20">
                        <h4 className="text-xs font-display tracking-wide text-mine mb-2 flex items-center gap-1">
                          <span>👎</span> 注意点
                        </h4>
                        <ul className="space-y-1">
                          {analytics.negative_points.map((point, i) => (
                            <li key={i} className="text-xs text-white/60">
                              • {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                </>
              )}

              {/* レビュー一覧セクション */}
              <motion.div
                className="space-y-3"
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-display tracking-wide text-gold/80 flex items-center gap-2">
                    <span>🎰</span>
                    ユーザーレビュー
                  </h3>
                  {reviews.length > 0 && (
                    <span className="text-xs text-white/40 bg-casino-black/50 px-2 py-0.5 rounded-full">
                      {reviews.length}件
                    </span>
                  )}
                </div>

                {/* ローディング */}
                {reviewsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                )}

                {/* レビューリスト */}
                {!reviewsLoading && reviews.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {reviews.map((review, index) => (
                      <ReviewCard key={review.id} review={review} index={index} shouldReduceMotion={shouldReduceMotion} />
                    ))}
                  </div>
                )}

                {/* 空状態 */}
                {!reviewsLoading && reviews.length === 0 && (
                  <div className="text-center py-6 text-white/40">
                    <p className="text-sm">レビューがありません</p>
                  </div>
                )}
              </motion.div>

              {/* 解析未実施 */}
              {!analytics && (
                <motion.div
                  className="p-4 bg-casino-black/30 rounded-xl text-center border border-white/5"
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-white/50 mb-3">AI解析が未実施です</p>
                  <motion.button
                    className="px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm hover:bg-gold/30 transition-colors border border-gold/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    解析を実行
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// レビューカードコンポーネント
interface ReviewCardProps {
  review: Review;
  index: number;
  shouldReduceMotion: boolean | null;
}

function ReviewCard({ review, index, shouldReduceMotion }: ReviewCardProps) {
  // 日本語翻訳があればそれを使用、なければ元のテキスト
  const displayText = review.text_ja || review.text;

  return (
    <motion.div
      className="p-3 bg-casino-black/40 rounded-lg border border-white/5 hover:border-gold/20 transition-colors"
      initial={shouldReduceMotion ? {} : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      {/* ヘッダー: 星評価 + 著者 + 日時 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {review.rating && (
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${i < review.rating! ? 'text-gold' : 'text-white/20'}`}
                >
                  ★
                </span>
              ))}
            </div>
          )}
          {review.author_name && (
            <span className="text-xs text-white/60">{review.author_name}</span>
          )}
        </div>
        {review.relative_time_description && (
          <span className="text-xs text-white/40">{review.relative_time_description}</span>
        )}
      </div>

      {/* レビューテキスト */}
      {displayText ? (
        <p className="text-sm text-white/70 leading-relaxed">{displayText}</p>
      ) : (
        <p className="text-xs text-white/40 italic">(テキストなしの評価)</p>
      )}
    </motion.div>
  );
}
