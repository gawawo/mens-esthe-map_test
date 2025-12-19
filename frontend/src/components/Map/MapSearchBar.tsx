'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { TOKYO_AREAS } from '@/lib/constants';

export function MapSearchBar() {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const { moveToLocation } = useMapStore();

  const handleAreaSelect = (area: (typeof TOKYO_AREAS)[number]) => {
    setSelectedArea(area.key);
    moveToLocation(area.lat, area.lng, 15);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedArea('current');
          moveToLocation(latitude, longitude, 15);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <div className="absolute top-4 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:right-auto z-30 pointer-events-none">
      <motion.div
        className="flex items-center gap-1 md:gap-1.5 bg-casino-velvet/90 backdrop-blur-sm rounded-full p-1 md:p-1.5 border border-gold/20 pointer-events-auto max-w-full"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 1px rgba(255,215,0,0.3)',
        }}
      >
        {/* ロゴ */}
        <span className="px-2 md:px-3 py-1.5 md:py-2 font-display text-gold tracking-wider text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0">
          <span className="hidden md:inline">ESTHE MAP</span>
          <span className="md:hidden">MAP</span>
        </span>

        {/* 区切り線 */}
        <div className="w-px h-5 md:h-6 bg-gold/20 flex-shrink-0" />

        {/* エリアボタンコンテナ - 横スクロール可能 */}
        <div className="flex overflow-x-auto scrollbar-hide gap-1 flex-1 min-w-0">
          {TOKYO_AREAS.map((area, index) => (
            <motion.button
              key={area.key}
              onClick={() => handleAreaSelect(area)}
              className={`
                px-2 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0
                ${selectedArea === area.key
                  ? 'bg-gold text-black font-medium'
                  : 'text-white/70 hover:text-gold hover:bg-gold/10'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={shouldReduceMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {area.name}
            </motion.button>
          ))}
        </div>

        {/* 区切り線 */}
        <div className="w-px h-5 md:h-6 bg-gold/20 mx-0.5 md:mx-1 flex-shrink-0" />

        {/* 現在地ボタン */}
        <motion.button
          onClick={handleCurrentLocation}
          className={`
            px-2 md:px-3 py-1.5 md:py-2 rounded-full transition-all flex items-center gap-1 flex-shrink-0
            ${selectedArea === 'current'
              ? 'bg-gold text-black'
              : 'text-gold/70 hover:text-gold hover:bg-gold/10'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="現在地を取得"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-xs md:text-sm hidden md:inline">現在地</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
