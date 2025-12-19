'use client';

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { ShopAnalytics } from '@/types';
import { SCORE_LABELS } from '@/lib/constants';

interface RadarChartProps {
  analytics: ShopAnalytics;
  size?: number;
}

export function RadarChart({ analytics, size = 200 }: RadarChartProps) {
  const data = [
    {
      subject: SCORE_LABELS.score_operation,
      value: analytics.score_operation,
      fullMark: 10,
    },
    {
      subject: SCORE_LABELS.score_accuracy,
      value: analytics.score_accuracy,
      fullMark: 10,
    },
    {
      subject: SCORE_LABELS.score_hygiene,
      value: analytics.score_hygiene,
      fullMark: 10,
    },
    {
      subject: SCORE_LABELS.score_sincerity,
      value: analytics.score_sincerity,
      fullMark: 10,
    },
    {
      subject: SCORE_LABELS.score_safety,
      value: analytics.score_safety,
      fullMark: 10,
    },
  ];

  // リスクレベルに応じた色
  const fillColor = {
    safe: '#22c55e',
    gamble: '#eab308',
    mine: '#ef4444',
    fake: '#9ca3af',
  }[analytics.risk_level] || '#6b7280';

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickCount={6}
          />
          <Radar
            name="スコア"
            dataKey="value"
            stroke={fillColor}
            fill={fillColor}
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
