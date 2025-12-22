/**
 * 店舗データの状態管理
 */

import { create } from 'zustand';
import type { Shop, RiskLevel } from '@/types';
import { getShops, getNearbyShops, getShop } from '@/lib/api';

interface ShopState {
  // データ
  shops: Shop[];
  selectedShop: Shop | null;
  isLoading: boolean;
  error: string | null;

  // アクション
  fetchShops: (params?: {
    page?: number;
    per_page?: number;
    risk_level?: RiskLevel;
    min_rating?: number;
  }) => Promise<void>;

  fetchNearbyShops: (params: {
    lat: number;
    lng: number;
    radius?: number;
    limit?: number;
    risk_level?: RiskLevel;
  }) => Promise<void>;

  fetchShopById: (shopId: string) => Promise<void>;
  selectShop: (shop: Shop | null) => void;
  setShops: (shops: Shop[]) => void;
  clearError: () => void;
}

export const useShopStore = create<ShopState>((set) => ({
  // 初期状態
  shops: [],
  selectedShop: null,
  isLoading: false,
  error: null,

  // 店舗一覧を取得
  fetchShops: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await getShops(params);
      set({ shops: response.shops, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '店舗データの取得に失敗しました',
        isLoading: false,
      });
    }
  },

  // 近隣店舗を取得
  fetchNearbyShops: async (params) => {
    set({ isLoading: true, error: null });

    try {
      const shops = await getNearbyShops(params);
      set({ shops, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '近隣店舗の取得に失敗しました',
        isLoading: false,
      });
    }
  },

  // IDで店舗を取得して選択
  fetchShopById: async (shopId) => {
    set({ isLoading: true, error: null });

    try {
      const shop = await getShop(shopId);
      set({ selectedShop: shop, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '店舗詳細の取得に失敗しました',
        isLoading: false,
      });
    }
  },

  // 店舗を選択
  selectShop: (shop) => {
    set({ selectedShop: shop });
  },

  // 店舗一覧を直接設定（SSR用）
  setShops: (shops) => {
    set({ shops, isLoading: false });
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));
