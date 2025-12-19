'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion, useDragControls, PanInfo } from 'framer-motion';
import { TOKYO_AREAS } from '@/lib/constants';
import { getShopRanking, type RankingItem } from '@/lib/api';
import { RiskBadge } from '@/components/Shop/RiskBadge';
import { useShopStore } from '@/stores/shopStore';
import { useMapStore } from '@/stores/mapStore';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface AreaRankingProps {
  onShopSelect?: (shopId: string) => void;
}

// ランキングコンテンツ（デスクトップとモバイルで共有）
function RankingContent({
  selectedArea,
  ranking,
  loading,
  onAreaChange,
  onShopClick,
}: {
  selectedArea: string;
  ranking: RankingItem[];
  loading: boolean;
  onAreaChange: (area: string) => void;
  onShopClick: (item: RankingItem) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const selectedAreaName = TOKYO_AREAS.find(a => a.key === selectedArea)?.name || selectedArea;

  return (
    <>
      {/* エリア選択タブ */}
      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide border-b border-gold/10">
        {TOKYO_AREAS.map((area) => (
          <motion.button
            key={area.key}
            onClick={() => onAreaChange(area.key)}
            className={`
              px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0
              ${selectedArea === area.key
                ? 'bg-gold text-black font-medium'
                : 'bg-casino-black/50 text-white/60 hover:text-gold'}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {area.name}
          </motion.button>
        ))}
      </div>

      {/* ランキングヘッダー */}
      <div className="px-3 py-2 border-b border-gold/10">
        <p className="text-xs text-white/40">
          <span className="text-gold">{selectedAreaName}</span> エリア TOP10
        </p>
      </div>

      {/* ローディング */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <motion.div
            className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}

      {/* ランキングリスト */}
      {!loading && ranking.length > 0 && (
        <div className="max-h-80 overflow-y-auto scrollbar-hide">
          {ranking.map((item, index) => (
            <motion.button
              key={item.shop.id}
              onClick={() => onShopClick(item)}
              className="w-full flex items-center gap-2 p-2 hover:bg-gold/5 transition-colors border-b border-white/5 last:border-b-0 text-left"
              initial={shouldReduceMotion ? {} : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              {/* 順位 */}
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center font-score font-bold text-sm flex-shrink-0
                  ${item.rank <= 3
                    ? 'bg-gradient-to-br from-gold to-gold/70 text-black'
                    : 'bg-white/10 text-white/60'}
                `}
              >
                {item.rank}
              </div>

              {/* 店舗情報 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.shop.name}</p>
                <p className="text-[10px] text-white/40 truncate">
                  {item.shop.formatted_address?.replace(/^日本、〒\d{3}-\d{4}\s*/, '').substring(0, 20)}
                </p>
              </div>

              {/* スコア */}
              <div className="text-right flex-shrink-0">
                <p className="text-base font-score text-gold font-bold">
                  {item.avg_score.toFixed(1)}
                </p>
              </div>

              {/* リスクバッジ */}
              <div className="flex-shrink-0">
                <RiskBadge
                  level={item.shop.analytics?.risk_level || 'gamble'}
                  size="sm"
                  showLabel={false}
                  animated={false}
                />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* 空状態 */}
      {!loading && ranking.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-white/40">
            このエリアにはランキング対象店舗がありません
          </p>
        </div>
      )}
    </>
  );
}

// モバイル用ボトムシート
function RankingSheet({
  selectedArea,
  ranking,
  loading,
  onAreaChange,
  onShopClick,
  onClose,
}: {
  selectedArea: string;
  ranking: RankingItem[];
  loading: boolean;
  onAreaChange: (area: string) => void;
  onShopClick: (item: RankingItem) => void;
  onClose: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const dragControls = useDragControls();

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <>
      {/* オーバーレイ */}
      <motion.div
        className="fixed inset-0 bg-black/60 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* シート */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-casino-velvet/95 backdrop-blur-md rounded-t-3xl border-t border-gold/20 safe-area-bottom max-h-[70vh]"
        initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
        animate={{ y: 0, opacity: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}
      >
        {/* ドラッグハンドル */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="flex items-center gap-2 px-4 pb-2">
          <span className="text-lg">🏆</span>
          <span className="text-sm font-display tracking-wide text-gold">ランキング</span>
        </div>

        {/* コンテンツ */}
        <RankingContent
          selectedArea={selectedArea}
          ranking={ranking}
          loading={loading}
          onAreaChange={onAreaChange}
          onShopClick={onShopClick}
        />
      </motion.div>
    </>
  );
}

export function AreaRanking({ onShopSelect }: AreaRankingProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isMobile } = useBreakpoint();
  const [selectedArea, setSelectedArea] = useState<string>('shinjuku');
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { fetchShopById } = useShopStore();
  const { moveToLocation, setDetailPanelOpen } = useMapStore();

  const fetchRanking = useCallback(async (area: string) => {
    setLoading(true);
    try {
      const data = await getShopRanking({ area, limit: 10 });
      setRanking(data.ranking);
    } catch (error) {
      console.error('Failed to fetch ranking:', error);
      setRanking([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isExpanded) {
      fetchRanking(selectedArea);
    }
  }, [selectedArea, isExpanded, fetchRanking]);

  const handleAreaChange = (areaKey: string) => {
    setSelectedArea(areaKey);
  };

  const handleShopClick = async (item: RankingItem) => {
    // 店舗詳細を取得して選択
    await fetchShopById(item.shop.id);
    setDetailPanelOpen(true);

    // 地図を移動
    if (item.shop.location) {
      moveToLocation(item.shop.location.lat, item.shop.location.lng);
    }

    onShopSelect?.(item.shop.id);

    // モバイルではシートを閉じる
    if (isMobile) {
      setIsExpanded(false);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  // モバイル: 左サイドボタン + ボトムシート
  if (isMobile) {
    return (
      <>
        {/* ランキングボタン（フィルターチップの下） */}
        <motion.button
          onClick={() => setIsExpanded(true)}
          className="absolute top-[244px] left-2 z-30 w-10 h-10 rounded-full bg-casino-velvet/90 backdrop-blur-sm border border-gold/30 text-gold flex items-center justify-center"
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(255,215,0,0.2)' }}
        >
          <span className="text-base">🏆</span>
        </motion.button>

        <AnimatePresence>
          {isExpanded && (
            <RankingSheet
              selectedArea={selectedArea}
              ranking={ranking}
              loading={loading}
              onAreaChange={handleAreaChange}
              onShopClick={handleShopClick}
              onClose={handleClose}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // デスクトップ: 従来のドロップダウンパネル
  return (
    <div className="absolute top-[136px] left-2 z-30 pointer-events-none">
      <motion.div
        className="relative pointer-events-auto"
        initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* トグルボタン */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full
            bg-casino-velvet/90 backdrop-blur-sm
            border border-gold/30
            text-gold hover:text-white hover:border-gold/50 transition-all
          `}
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-lg">🏆</span>
          <span className="text-sm font-display tracking-wide">ランキング</span>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.span>
        </motion.button>

        {/* ランキングパネル */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="absolute top-full left-0 mt-2 bg-casino-velvet/95 backdrop-blur-sm rounded-2xl border border-gold/20 w-80 overflow-hidden"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <RankingContent
                selectedArea={selectedArea}
                ranking={ranking}
                loading={loading}
                onAreaChange={handleAreaChange}
                onShopClick={handleShopClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
