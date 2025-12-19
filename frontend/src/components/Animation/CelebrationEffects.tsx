'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  type: 'confetti' | 'coin' | 'sparkle';
}

interface CelebrationEffectsProps {
  type: 'confetti' | 'coin' | 'sparkle' | 'jackpot';
  trigger: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

const confettiColors = [
  '#00ff88', // safe green
  '#ffd700', // gold
  '#ff1493', // neon pink
  '#00f5ff', // neon cyan
  '#9945ff', // neon purple
];

export function CelebrationEffects({
  type,
  trigger,
  duration = 3000,
  particleCount = 50,
  onComplete,
}: CelebrationEffectsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isActive, setIsActive] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const generateParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 720,
        scale: 0.5 + Math.random() * 0.5,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        type: type === 'jackpot'
          ? (['confetti', 'coin', 'sparkle'] as const)[Math.floor(Math.random() * 3)]
          : type === 'confetti' ? 'confetti' : type === 'coin' ? 'coin' : 'sparkle',
      });
    }
    return newParticles;
  }, [particleCount, type]);

  useEffect(() => {
    if (trigger && !shouldReduceMotion) {
      setIsActive(true);
      setParticles(generateParticles());

      const timer = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, duration, shouldReduceMotion, generateParticles, onComplete]);

  if (shouldReduceMotion || !isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
            }}
            initial={{
              y: `${particle.y}vh`,
              rotate: 0,
              scale: particle.scale,
              opacity: 1,
            }}
            animate={{
              y: '110vh',
              rotate: particle.rotation,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              ease: 'linear',
            }}
          >
            {particle.type === 'confetti' && (
              <div
                className="w-3 h-3"
                style={{
                  backgroundColor: particle.color,
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                }}
              />
            )}
            {particle.type === 'coin' && (
              <motion.div
                className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-dark border border-gold-dark"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                }}
              >
                <span className="text-xs font-bold text-casino-black flex items-center justify-center h-full">
                  $
                </span>
              </motion.div>
            )}
            {particle.type === 'sparkle' && (
              <motion.div
                className="text-2xl"
                animate={{
                  scale: [0.5, 1, 0.5],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                ✨
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Simplified sparkle burst for inline use
export function SparkleEffect({ trigger }: { trigger: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger && !shouldReduceMotion) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger, shouldReduceMotion]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-gold"
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * Math.PI * 2) / 6) * 30,
            y: Math.sin((i * Math.PI * 2) / 6) * 30,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  );
}
