'use client';

import { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useShopStore } from '@/stores/shopStore';
import { useMapStore } from '@/stores/mapStore';
import { ShopCard } from '@/components/Shop/ShopCard';
import type { Shop, RiskLevel } from '@/types';

interface ShopCarouselProps {
  onShopSelect?: (shopId: string) => void;
}

// リスクレベル別のグローカラー
const GLOW_COLORS: Record<RiskLevel, string> = {
  safe: 'rgba(0, 255, 136, 0.2)',
  gamble: 'rgba(255, 215, 0, 0.2)',
  mine: 'rgba(255, 51, 102, 0.2)',
  fake: 'rgba(139, 92, 246, 0.2)',
};

export function ShopCarousel({ onShopSelect }: ShopCarouselProps) {
  const shouldReduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { shops, selectedShop, selectShop, fetchShopById } = useShopStore();
  const { layout, toggleCarousel, moveToLocation, bounds } = useMapStore();

  // ビューポート内の店舗のみをフィルタリング
  const visibleShops = useMemo(() => {
    if (!bounds) return shops;
    return shops.filter(shop => {
      if (!shop.location) return false;
      const { lat, lng } = shop.location;
      return (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      );
    });
  }, [shops, bounds]);

  // 選択された店舗にスクロール
  useEffect(() => {
    if (selectedShop && scrollRef.current) {
      const selectedIndex = visibleShops.findIndex((s) => s.id === selectedShop.id);
      if (selectedIndex !== -1) {
        const cardWidth = 300; // カードの幅 + gap
        scrollRef.current.scrollTo({
          left: selectedIndex * cardWidth - scrollRef.current.clientWidth / 2 + cardWidth / 2,
          behavior: shouldReduceMotion ? 'auto' : 'smooth',
        });
      }
    }
  }, [selectedShop, visibleShops, shouldReduceMotion]);

  const handleShopClick = async (shop: Shop) => {
    await fetchShopById(shop.id);
    if (shop.location) {
      moveToLocation(shop.location.lat, shop.location.lng);
    }
    onShopSelect?.(shop.id);
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -300,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 300,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
    }
  };

  if (visibleShops.length === 0) return null;

  return (
    <AnimatePresence>
      {layout.isCarouselVisible && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-20 w-full pointer-events-none"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? {} : { opacity: 0, y: 50 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="relative pointer-events-auto">
            {/* 背景 */}
            <div
              className="absolute inset-0 rounded-t-2xl bg-casino-black/60 backdrop-blur-sm border border-gold/10 border-b-0 pointer-events-none"
              style={{
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
              }}
            />

            {/* ヘッダー */}
            <div className="relative flex items-center justify-between px-4 py-2">
              <span className="text-xs text-gold/60 font-display tracking-wider">
                {visibleShops.length} 件の店舗
              </span>
              <motion.button
                onClick={toggleCarousel}
                className="text-white/40 hover:text-gold transition-colors p-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="カルーセルを閉じる"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>
            </div>

            {/* カルーセル本体 */}
            <div className="relative">
              {/* 左矢印 (モバイルでは非表示) */}
              <motion.button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-casino-velvet/90 border border-gold/30 text-gold/70 hover:text-gold hidden md:flex items-center justify-center"
                style={{ boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>

              {/* カードコンテナ */}
              <div
                ref={scrollRef}
                className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-12 py-2 md:py-3 snap-x snap-mandatory"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {visibleShops.map((shop, index) => (
                  <motion.div
                    key={shop.id}
                    className="flex-shrink-0 w-60 md:w-72 snap-center"
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <ShopCard
                      shop={shop}
                      onClick={() => handleShopClick(shop)}
                      isSelected={selectedShop?.id === shop.id}
                    />
                  </motion.div>
                ))}
              </div>

              {/* 右矢印 (モバイルでは非表示) */}
              <motion.button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-casino-velvet/90 border border-gold/30 text-gold/70 hover:text-gold hidden md:flex items-center justify-center"
                style={{ boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>

            {/* スクロールインジケーター */}
            <div className="relative flex justify-center gap-1 py-2">
              {visibleShops.slice(0, Math.min(visibleShops.length, 10)).map((shop, index) => (
                <motion.div
                  key={shop.id}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    selectedShop?.id === shop.id ? 'bg-gold' : 'bg-white/20'
                  }`}
                  animate={selectedShop?.id === shop.id ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              ))}
              {visibleShops.length > 10 && (
                <span className="text-xs text-white/30">...</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// カルーセル表示トグルボタン（カルーセルが非表示の時に表示）
export function ShopCarouselToggle() {
  const shouldReduceMotion = useReducedMotion();
  const { shops } = useShopStore();
  const { layout, toggleCarousel, bounds } = useMapStore();

  // ビューポート内の店舗のみをフィルタリング
  const visibleShops = useMemo(() => {
    if (!bounds) return shops;
    return shops.filter(shop => {
      if (!shop.location) return false;
      const { lat, lng } = shop.location;
      return (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      );
    });
  }, [shops, bounds]);

  if (layout.isCarouselVisible || visibleShops.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <motion.button
        onClick={toggleCarousel}
        className="px-4 py-2 bg-casino-velvet/90 backdrop-blur-sm border border-gold/30 rounded-full text-sm text-gold/80 hover:text-gold flex items-center gap-2 pointer-events-auto"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        {visibleShops.length} 件の店舗を表示
      </motion.button>
    </div>
  );
}
