'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import type { CharacterMood } from '@/types/character';

interface ParticleEffectsProps {
  mood: CharacterMood;
  isActive: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  scale: number;
  rotation: number;
}

// ムードごとのパーティクル設定
const MOOD_PARTICLES: Record<string, string[]> = {
  excited: ['✨', '⭐', '💫', '🌟'],
  celebrating: ['🎉', '✨', '🎊', '💰', '🪙'],
  warning: ['💣', '⚠️', '💥'],
  suspicious: ['👻', '❓', '🔍'],
  default: ['✨'],
};

export function ParticleEffects({ mood, isActive }: ParticleEffectsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const generateParticle = useCallback((): Particle => {
    const emojis = MOOD_PARTICLES[mood] || MOOD_PARTICLES.default;
    return {
      id: Date.now() + Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      scale: 0.5 + Math.random() * 0.5,
      rotation: Math.random() * 360,
    };
  }, [mood]);

  useEffect(() => {
    if (!isActive || shouldReduceMotion) {
      setParticles([]);
      return;
    }

    // 初期パーティクル生成
    const initialParticles = Array.from({ length: 8 }, generateParticle);
    setParticles(initialParticles);

    // パーティクル追加
    const interval = setInterval(() => {
      setParticles((prev) => {
        if (prev.length > 15) {
          return [...prev.slice(1), generateParticle()];
        }
        return [...prev, generateParticle()];
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isActive, shouldReduceMotion, generateParticle]);

  if (shouldReduceMotion || !isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute text-xl"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            initial={{
              opacity: 0,
              scale: 0,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, particle.scale, 0],
              rotate: particle.rotation,
              y: [-20, -50],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
            }}
          >
            {particle.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ラッキースパークル (常時軽いキラキラ)
export function LuckySparkle({ intensity = 1 }: { intensity?: number }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(Math.floor(3 * intensity))].map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-gold text-xs"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  );
}
