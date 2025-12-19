'use client';

import { useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapContainer } from '@/components/Map/MapContainer';
import { MapSearchBar } from '@/components/Map/MapSearchBar';
import { MapFilterChips } from '@/components/Map/MapFilterChips';
import { ShopCarousel, ShopCarouselToggle } from '@/components/Map/ShopCarousel';
import { ShopDetailPanel } from '@/components/Shop/ShopDetailPanel';
import { AreaRanking } from '@/components/Ranking/AreaRanking';
import { DetailedFilterPanel } from '@/components/Filter/DetailedFilterPanel';
import { useShopStore } from '@/stores/shopStore';
import { useMapStore } from '@/stores/mapStore';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function Home() {
  const { fetchShopById } = useShopStore();
  const { setDetailPanelOpen } = useMapStore();

  const handleShopSelect = useCallback(async (shopId: string) => {
    await fetchShopById(shopId);
    setDetailPanelOpen(true);
  }, [fetchShopById, setDetailPanelOpen]);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <main className="relative h-screen w-screen bg-casino-black overflow-hidden">
        {/* 地図（フルスクリーン） */}
        <div className="absolute inset-0">
          <MapContainer />
        </div>

        {/* マップオーバーレイグラデーション（下部） */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to top, rgba(10, 10, 15, 0.5), transparent)',
          }}
        />

        {/* 検索バー（上部中央） */}
        <MapSearchBar />

        {/* フィルターチップ（左上） */}
        <MapFilterChips />

        {/* 店舗カルーセル（下部中央） */}
        <ShopCarousel onShopSelect={handleShopSelect} />
        <ShopCarouselToggle />

        {/* 店舗詳細パネル（右側スライドイン） */}
        <ShopDetailPanel />

        {/* 詳細フィルターパネル（右上） */}
        <DetailedFilterPanel />

        {/* エリアランキング（左上・フィルターチップの下） */}
        <AreaRanking onShopSelect={handleShopSelect} />

      </main>
    </APIProvider>
  );
}
