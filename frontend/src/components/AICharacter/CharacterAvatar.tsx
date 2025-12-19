'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { CharacterMood, MoodConfig } from '@/types/character';
import { MOOD_CONFIGS } from '@/types/character';

interface CharacterAvatarProps {
  mood: CharacterMood;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const SIZE_CLASSES = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-14 h-14 text-2xl',
  lg: 'w-20 h-20 text-4xl',
};

type EaseType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

const getAnimationVariant = (animation: string) => {
  const easeInOut: EaseType = 'easeInOut';
  const linear: EaseType = 'linear';

  switch (animation) {
    case 'bounce':
      return {
        y: [0, -8, 0],
        transition: { duration: 0.6, repeat: Infinity, ease: easeInOut },
      };
    case 'pulse':
      return {
        scale: [1, 1.1, 1],
        transition: { duration: 1, repeat: Infinity, ease: easeInOut },
      };
    case 'shake':
      return {
        x: [-2, 2, -2, 2, 0],
        transition: { duration: 0.4, repeat: Infinity, repeatDelay: 1 },
      };
    case 'spin':
      return {
        rotate: [0, 360],
        transition: { duration: 2, repeat: Infinity, ease: linear },
      };
    case 'float':
      return {
        y: [0, -5, 0],
        rotate: [-2, 2, -2],
        transition: { duration: 3, repeat: Infinity, ease: easeInOut },
      };
    default:
      return {};
  }
};

export function CharacterAvatar({
  mood,
  size = 'md',
  onClick,
}: CharacterAvatarProps) {
  const shouldReduceMotion = useReducedMotion();
  const config: MoodConfig = MOOD_CONFIGS[mood];

  const animation = shouldReduceMotion ? 'none' : config.animation;

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex items-center justify-center rounded-full
        bg-casino-velvet border-2 border-gold/30
        cursor-pointer transition-colors
        hover:border-gold/60
        ${SIZE_CLASSES[size]}
      `}
      style={{
        boxShadow: `0 0 20px ${config.glowColor}, inset 0 0 15px rgba(0,0,0,0.5)`,
      }}
      animate={getAnimationVariant(animation)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* グロー背景 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
        }}
        animate={
          !shouldReduceMotion
            ? {
                opacity: [0.3, 0.6, 0.3],
              }
            : undefined
        }
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* エモジ */}
      <span className="relative z-10">{config.emoji}</span>

      {/* 選択リング */}
      <motion.div
        className="absolute -inset-1 rounded-full border border-gold/20"
        animate={
          !shouldReduceMotion
            ? {
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.2, 0.5],
              }
            : undefined
        }
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.button>
  );
}
