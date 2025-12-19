'use client';

import { useCallback, useMemo, useEffect, useState } from 'react';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import type { Shop, RiskLevel } from '@/types';
import { useShopStore } from '@/stores/shopStore';
import { RISK_LEVEL_ICONS } from '@/lib/constants';

interface ShopMarkerProps {
  shop: Shop;
  dimmed?: boolean;
  onClick?: () => void;
}

// リスクレベル別カラー設定
const CHIP_COLORS: Record<RiskLevel, {
  primary: string;
  glow: string;
  text: string;
  opacity: number;
}> = {
  safe: {
    primary: '#00ff88',
    glow: 'rgba(0, 255, 136, 0.6)',
    text: '#00ff88',
    opacity: 1,
  },
  gamble: {
    primary: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.6)',
    text: '#ffd700',
    opacity: 1,
  },
  mine: {
    primary: '#ff3366',
    glow: 'rgba(255, 51, 102, 0.6)',
    text: '#ff3366',
    opacity: 1,
  },
  fake: {
    primary: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.6)',
    text: '#8b5cf6',
    opacity: 0.7,
  },
};

export function ShopMarker({ shop, dimmed = false, onClick }: ShopMarkerProps) {
  const { selectedShop } = useShopStore();
  const isSelected = selectedShop?.id === shop.id;
  const [isPulsing, setIsPulsing] = useState(false);

  const riskLevel: RiskLevel = shop.analytics?.risk_level || 'gamble';
  const colors = CHIP_COLORS[riskLevel];
  const icon = RISK_LEVEL_ICONS[riskLevel];

  // パルスアニメーション制御
  useEffect(() => {
    if (isSelected || riskLevel === 'gamble' || riskLevel === 'mine') {
      const interval = setInterval(() => {
        setIsPulsing(prev => !prev);
      }, riskLevel === 'mine' ? 400 : riskLevel === 'gamble' ? 750 : 1000);
      return () => clearInterval(interval);
    }
  }, [isSelected, riskLevel]);

  const markerContent = useMemo(() => {
    const baseSize = isSelected ? 56 : 44;
    const innerSize = baseSize - 8;
    const fontSize = isSelected ? 18 : 14;

    // カジノチップSVGスタイル
    const chipStyle: React.CSSProperties = {
      width: baseSize,
      height: baseSize,
      position: 'relative',
      cursor: 'pointer',
      transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
      opacity: colors.opacity,
    };

    const outerCircleStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: '#0a0a0f',
      border: `3px dashed ${colors.primary}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: isPulsing || isSelected
        ? `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}, inset 0 0 10px rgba(255,255,255,0.05)`
        : `0 0 8px ${colors.glow}, inset 0 0 8px rgba(255,255,255,0.05)`,
      transition: 'box-shadow 0.3s ease-in-out',
    };

    const innerCircleStyle: React.CSSProperties = {
      width: innerSize,
      height: innerSize,
      borderRadius: '50%',
      border: `1px solid ${colors.primary}`,
      opacity: 0.3,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
    };

    const iconStyle: React.CSSProperties = {
      fontSize: fontSize,
      fontWeight: 'bold',
      fontFamily: "'Orbitron', monospace",
      color: colors.text,
      textShadow: `0 0 10px ${colors.glow}`,
      position: 'relative',
      zIndex: 1,
    };

    // 選択時のリングエフェクト
    const selectedRingStyle: React.CSSProperties = isSelected ? {
      position: 'absolute',
      inset: -4,
      borderRadius: '50%',
      border: '2px solid',
      borderColor: colors.primary,
      animation: 'pulse-ring 1.5s ease-in-out infinite',
      opacity: 0.5,
    } : {};

    return (
      <div style={chipStyle} title={shop.name}>
        {/* 選択時の外側リング */}
        {isSelected && <div style={selectedRingStyle} />}

        {/* 外側チップ枠 */}
        <div style={outerCircleStyle}>
          {/* 内側リング装飾 */}
          <div style={innerCircleStyle} />

          {/* アイコン */}
          <span style={iconStyle}>{icon}</span>
        </div>

        {/* グローエフェクトのアニメーション用スタイル */}
        <style>{`
          @keyframes pulse-ring {
            0%, 100% {
              transform: scale(1);
              opacity: 0.5;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.2;
            }
          }
        `}</style>
      </div>
    );
  }, [shop.name, colors, icon, isSelected, isPulsing]);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  // リスクレベルに応じたピンの色
  const pinColors: Record<RiskLevel, { background: string; borderColor: string; glyphColor: string }> = {
    safe: { background: '#00ff88', borderColor: '#00cc6a', glyphColor: '#ffffff' },
    gamble: { background: '#ffd700', borderColor: '#cc9900', glyphColor: '#000000' },
    mine: { background: '#ff3366', borderColor: '#cc1a4a', glyphColor: '#ffffff' },
    fake: { background: '#8b5cf6', borderColor: '#6d28d9', glyphColor: '#ffffff' },
  };

  const pinColor = pinColors[riskLevel];

  // dimmed時のグレースケールカラー
  const dimmedColor = {
    background: '#666666',
    borderColor: '#444444',
    glyphColor: '#999999',
  };

  const actualColor = dimmed ? dimmedColor : pinColor;
  const scale = isSelected ? 1.3 : dimmed ? 0.7 : 1;

  return (
    <AdvancedMarker
      position={shop.location}
      onClick={handleClick}
      title={shop.name}
      zIndex={dimmed ? 0 : isSelected ? 100 : 10}
    >
      <Pin
        background={actualColor.background}
        borderColor={actualColor.borderColor}
        glyphColor={actualColor.glyphColor}
        scale={scale}
      />
    </AdvancedMarker>
  );
}
