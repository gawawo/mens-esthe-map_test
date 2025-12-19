'use client';

import { useEffect, useCallback } from 'react';
import { useShopStore } from '@/stores/shopStore';
import { useFilterStore } from '@/stores/filterStore';
import type { RiskLevel } from '@/types';

interface UseShopsOptions {
  autoFetch?: boolean;
  page?: number;
  perPage?: number;
  riskLevel?: RiskLevel;
  minRating?: number;
}

export function useShops(options: UseShopsOptions = {}) {
  const { autoFetch = true, page = 1, perPage = 50, riskLevel, minRating } = options;

  const {
    shops,
    selectedShop,
    isLoading,
    error,
    fetchShops,
    selectShop,
    clearError,
  } = useShopStore();

  const { isShopVisible } = useFilterStore();

  // 初回取得
  useEffect(() => {
    if (autoFetch) {
      fetchShops({ page, per_page: perPage, risk_level: riskLevel, min_rating: minRating });
    }
  }, [autoFetch, fetchShops, page, perPage, riskLevel, minRating]);

  // フィルター適用した店舗リスト
  const filteredShops = shops.filter((shop) =>
    isShopVisible(shop.analytics, shop.rating)
  );

  // 再取得
  const refetch = useCallback(() => {
    fetchShops({ page, per_page: perPage, risk_level: riskLevel, min_rating: minRating });
  }, [fetchShops, page, perPage, riskLevel, minRating]);

  return {
    shops: filteredShops,
    allShops: shops,
    selectedShop,
    isLoading,
    error,
    selectShop,
    clearError,
    refetch,
  };
}
