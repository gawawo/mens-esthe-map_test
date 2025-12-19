'use client';

import { motion } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { useShopStore } from '@/stores/shopStore';
import { TOKYO_AREAS } from '@/lib/constants';

export function AreaSelector() {
  const { moveToLocation } = useMapStore();
  const { fetchNearbyShops } = useShopStore();

  const handleAreaSelect = (area: (typeof TOKYO_AREAS)[number]) => {
    moveToLocation(area.lat, area.lng, 15);
    fetchNearbyShops({
      lat: area.lat,
      lng: area.lng,
      radius: 1500,
      limit: 100,
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-display tracking-wide text-gold/80">エリア選択</h3>
      <div className="flex flex-wrap gap-2">
        {TOKYO_AREAS.map((area, index) => (
          <motion.button
            key={area.key}
            onClick={() => handleAreaSelect(area)}
            className="px-3 py-1.5 bg-casino-black/50 hover:bg-casino-felt border border-gold/10 hover:border-gold/30 rounded-lg text-sm font-medium text-white/70 hover:text-gold transition-all"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {area.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
