/**
 * マップ状態の管理
 */

import { create } from 'zustand';
import type { MapCenter, MapBounds } from '@/types';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';

// レイアウト状態の型定義
interface MapLayoutState {
  isDetailPanelOpen: boolean;
  isFilterExpanded: boolean;
  isAIChatExpanded: boolean;
  isCarouselVisible: boolean;
}

interface MapState {
  // マップ状態
  center: MapCenter;
  zoom: number;
  bounds: MapBounds | null;

  // UI状態
  isMapReady: boolean;

  // レイアウト状態
  layout: MapLayoutState;

  // アクション
  setCenter: (center: MapCenter) => void;
  setZoom: (zoom: number) => void;
  setBounds: (bounds: MapBounds) => void;
  setMapReady: (ready: boolean) => void;
  moveToLocation: (lat: number, lng: number, zoom?: number) => void;
  resetView: () => void;

  // レイアウトアクション
  setDetailPanelOpen: (open: boolean) => void;
  setFilterExpanded: (expanded: boolean) => void;
  setAIChatExpanded: (expanded: boolean) => void;
  setCarouselVisible: (visible: boolean) => void;
  toggleDetailPanel: () => void;
  toggleFilter: () => void;
  toggleAIChat: () => void;
  toggleCarousel: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  // 初期状態
  center: DEFAULT_MAP_CENTER,
  zoom: DEFAULT_MAP_ZOOM,
  bounds: null,
  isMapReady: false,

  // レイアウト初期状態
  layout: {
    isDetailPanelOpen: false,
    isFilterExpanded: false,
    isAIChatExpanded: false,
    isCarouselVisible: true,
  },

  // 中心座標を設定
  setCenter: (center) => {
    set({ center });
  },

  // ズームレベルを設定
  setZoom: (zoom) => {
    set({ zoom });
  },

  // 表示範囲を設定
  setBounds: (bounds) => {
    set({ bounds });
  },

  // マップ準備完了を設定
  setMapReady: (ready) => {
    set({ isMapReady: ready });
  },

  // 指定座標に移動
  moveToLocation: (lat, lng, zoom) => {
    set({
      center: { lat, lng },
      ...(zoom !== undefined && { zoom }),
    });
  },

  // 初期表示にリセット
  resetView: () => {
    set({
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
    });
  },

  // レイアウトアクション
  setDetailPanelOpen: (open) => {
    set((state) => ({
      layout: { ...state.layout, isDetailPanelOpen: open },
    }));
  },

  setFilterExpanded: (expanded) => {
    set((state) => ({
      layout: { ...state.layout, isFilterExpanded: expanded },
    }));
  },

  setAIChatExpanded: (expanded) => {
    set((state) => ({
      layout: { ...state.layout, isAIChatExpanded: expanded },
    }));
  },

  setCarouselVisible: (visible) => {
    set((state) => ({
      layout: { ...state.layout, isCarouselVisible: visible },
    }));
  },

  toggleDetailPanel: () => {
    set((state) => ({
      layout: { ...state.layout, isDetailPanelOpen: !state.layout.isDetailPanelOpen },
    }));
  },

  toggleFilter: () => {
    set((state) => ({
      layout: { ...state.layout, isFilterExpanded: !state.layout.isFilterExpanded },
    }));
  },

  toggleAIChat: () => {
    set((state) => ({
      layout: { ...state.layout, isAIChatExpanded: !state.layout.isAIChatExpanded },
    }));
  },

  toggleCarousel: () => {
    set((state) => ({
      layout: { ...state.layout, isCarouselVisible: !state.layout.isCarouselVisible },
    }));
  },
}));
