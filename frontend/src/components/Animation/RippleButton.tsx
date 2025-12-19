'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'danger' | 'gold';
  disabled?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const variantClasses = {
  default: 'btn-casino',
  primary: 'btn-casino btn-casino-primary',
  danger: 'bg-mine/20 border border-mine/50 text-mine hover:bg-mine/30',
  gold: 'bg-gradient-to-r from-gold-dark via-gold to-gold-light text-casino-black font-bold',
};

const rippleColors = {
  default: 'rgba(255, 215, 0, 0.4)',
  primary: 'rgba(10, 10, 15, 0.3)',
  danger: 'rgba(255, 51, 102, 0.4)',
  gold: 'rgba(10, 10, 15, 0.3)',
};

export function RippleButton({
  children,
  onClick,
  className = '',
  variant = 'default',
  disabled = false,
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!shouldReduceMotion) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = {
        id: Date.now(),
        x,
        y,
      };

      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${className} relative overflow-hidden`}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: rippleColors[variant],
          }}
          initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            width: 300,
            height: 300,
            x: -150,
            y: -150,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
