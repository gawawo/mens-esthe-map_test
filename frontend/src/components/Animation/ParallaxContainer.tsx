'use client';

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { ReactNode, useRef, useEffect } from 'react';

interface ParallaxContainerProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  perspective?: number;
}

export function ParallaxContainer({
  children,
  className = '',
  intensity = 20,
  perspective = 1000,
}: ParallaxContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 100, damping: 20 });

  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-intensity, intensity]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = (e.clientX - centerX) / rect.width;
      const y = (e.clientY - centerY) / rect.height;

      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    const element = ref.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [shouldReduceMotion, mouseX, mouseY]);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{ perspective }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Parallax layer for depth effect
interface ParallaxLayerProps {
  children: ReactNode;
  depth: number; // 0 = background, 1 = foreground
  className?: string;
}

export function ParallaxLayer({
  children,
  depth,
  className = '',
}: ParallaxLayerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{
        transform: `translateZ(${depth * 50}px)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  );
}

// Floating animation wrapper
interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
  delay?: number;
}

export function FloatingElement({
  children,
  className = '',
  amplitude = 10,
  duration = 3,
  delay = 0,
}: FloatingElementProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [-amplitude / 2, amplitude / 2, -amplitude / 2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
