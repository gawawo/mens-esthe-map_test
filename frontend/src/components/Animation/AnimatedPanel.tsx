'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

type SlideDirection = 'left' | 'right' | 'top' | 'bottom';

interface AnimatedPanelProps {
  children: ReactNode;
  isOpen: boolean;
  direction?: SlideDirection;
  className?: string;
  overlayClassName?: string;
  showOverlay?: boolean;
  onClose?: () => void;
}

const slideVariants = {
  left: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },
  right: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },
  top: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  },
  bottom: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  },
};

export function AnimatedPanel({
  children,
  isOpen,
  direction = 'left',
  className = '',
  overlayClassName = '',
  showOverlay = true,
  onClose,
}: AnimatedPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = slideVariants[direction];
  const transition = shouldReduceMotion
    ? { duration: 0.01 }
    : {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {showOverlay && (
            <motion.div
              className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 ${overlayClassName}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              transition={
                shouldReduceMotion ? { duration: 0.01 } : { duration: 0.2 }
              }
            />
          )}
          <motion.div
            className={`z-50 ${className}`}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Collapsible section with smooth height animation
interface CollapsibleSectionProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}

export function CollapsibleSection({
  children,
  isOpen,
  className = '',
}: CollapsibleSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          className={`overflow-hidden ${className}`}
          initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0.01 }
              : {
                  height: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
                  opacity: { duration: 0.2 },
                }
          }
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// List item with stagger animation
interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function AnimatedList({
  children,
  className = '',
  staggerDelay = 0.05,
}: AnimatedListProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 20 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0.01 }
              : {
                  delay: index * staggerDelay,
                  duration: 0.3,
                  ease: 'easeOut',
                }
          }
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
