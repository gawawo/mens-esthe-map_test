'use client';

import { useCallback } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { useShopStore } from '@/stores/shopStore';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';

export function useMap() {
  const {
    center,
    zoom,
    bounds,
    isMapReady,
    setCenter,
    setZoom,
    setBounds,
    moveToLocation,
    resetView,
  } = useMapStore();

  const { fetchNearbyShops } = useShopStore();

  // エリアに移動して店舗を取得
  const goToArea = useCallback(
    (lat: number, lng: number, radius = 1500) => {
      moveToLocation(lat, lng, 15);
      fetchNearbyShops({ lat, lng, radius, limit: 100 });
    },
    [moveToLocation, fetchNearbyShops]
  );

  // 現在地に移動
  const goToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        goToArea(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        // フォールバック: 東京駅
        goToArea(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng);
      }
    );
  }, [goToArea]);

  return {
    center,
    zoom,
    bounds,
    isMapReady,
    setCenter,
    setZoom,
    setBounds,
    moveToLocation,
    resetView,
    goToArea,
    goToCurrentLocation,
  };
}
