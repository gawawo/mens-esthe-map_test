'use client';

import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'sm' | 'md' | 'lg' | 'xl';

interface BreakpointState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>({
    breakpoint: 'mobile',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    width: 0,
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let breakpoint: Breakpoint = 'mobile';

      if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
      else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
      else if (width >= BREAKPOINTS.md) breakpoint = 'md';
      else if (width >= BREAKPOINTS.sm) breakpoint = 'sm';

      setState({
        breakpoint,
        isMobile: width < BREAKPOINTS.md,
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg,
        width,
      });
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return state;
}
