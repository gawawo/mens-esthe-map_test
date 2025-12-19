'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ReactNode, useRef } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  tiltIntensity?: number;
  disabled?: boolean;
}

export function AnimatedCard({
  children,
  className = '',
  glowColor = 'rgba(255, 215, 0, 0.3)',
  tiltIntensity = 10,
  disabled = false,
}: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [tiltIntensity, -tiltIntensity]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-tiltIntensity, tiltIntensity]);

  const glowX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const glowY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      <motion.div
        className="absolute inset-0 rounded-card pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glowX} ${glowY}, ${glowColor}, transparent 50%)`,
          opacity: 0.5,
        }}
      />
      <div style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </motion.div>
  );
}
