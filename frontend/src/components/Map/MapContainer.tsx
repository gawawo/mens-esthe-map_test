'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { ShopMarker } from './ShopMarker';
import { useShopStore } from '@/stores/shopStore';
import { useFilterStore } from '@/stores/filterStore';
import { useMapStore } from '@/stores/mapStore';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';

export function MapContainer() {
  const map = useMap();
  const { shops, fetchShops, selectShop } = useShopStore();
  const { isShopVisible } = useFilterStore();
  const { center, zoom, setCenter, setZoom, setBounds, setMapReady } = useMapStore();

  // プログラム的な移動と、ユーザーのドラッグを区別するためのフラグ
  const isProgrammaticMove = useRef(false);
  const lastCenter = useRef(center);
  const lastZoom = useRef(zoom);

  // マップ準備完了時
  useEffect(() => {
    if (map) {
      setMapReady(true);
    }
  }, [map, setMapReady]);

  // 初回データ取得（全店舗を取得）
  useEffect(() => {
    fetchShops({ per_page: 500 });
  }, [fetchShops]);

  // ストアの center/zoom が変更された時にマップを移動（プログラム的な移動の場合のみ）
  useEffect(() => {
    if (!map) return;

    // center が変更された場合
    if (
      center.lat !== lastCenter.current.lat ||
      center.lng !== lastCenter.current.lng
    ) {
      isProgrammaticMove.current = true;
      map.panTo({ lat: center.lat, lng: center.lng });
      lastCenter.current = center;
    }

    // zoom が変更された場合
    if (zoom !== lastZoom.current) {
      isProgrammaticMove.current = true;
      map.setZoom(zoom);
      lastZoom.current = zoom;
    }
  }, [map, center, zoom]);

  // マップ移動完了時のコールバック
  const handleIdle = useCallback(() => {
    if (!map) return;

    // プログラム的な移動の後は、フラグをリセットして終了
    if (isProgrammaticMove.current) {
      isProgrammaticMove.current = false;
      return;
    }

    const newCenter = map.getCenter();
    const newZoom = map.getZoom();
    const bounds = map.getBounds();

    if (newCenter) {
      const newCenterObj = { lat: newCenter.lat(), lng: newCenter.lng() };
      lastCenter.current = newCenterObj;
      setCenter(newCenterObj);
    }

    if (newZoom) {
      lastZoom.current = newZoom;
      setZoom(newZoom);
    }

    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      setBounds({
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng(),
      });
    }
  }, [map, setCenter, setZoom, setBounds]);

  // マーカークリック時
  const handleMarkerClick = useCallback(
    (shop: typeof shops[0]) => {
      selectShop(shop);
    },
    [selectShop]
  );

  return (
    <Map
      defaultCenter={DEFAULT_MAP_CENTER}
      defaultZoom={DEFAULT_MAP_ZOOM}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapTypeControl={false}
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || undefined}
      onIdle={handleIdle}
      style={{ width: '100%', height: '100%' }}
    >
      {shops.map((shop) => {
        const matchesFilter = isShopVisible(shop.analytics, shop.rating);
        return (
          <ShopMarker
            key={shop.id}
            shop={shop}
            dimmed={!matchesFilter}
            onClick={() => handleMarkerClick(shop)}
          />
        );
      })}
    </Map>
  );
}
