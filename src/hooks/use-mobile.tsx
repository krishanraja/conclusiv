import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/**
 * Viewport height tier detection for adaptive mobile layouts.
 * - compact: < 700px (small phones, SE, landscape)
 * - standard: 700-849px (most phones)
 * - spacious: >= 850px (larger phones, tablets)
 */
export type ViewportTier = 'compact' | 'standard' | 'spacious';

export function useViewportTier(): ViewportTier {
  const [tier, setTier] = React.useState<ViewportTier>('standard');

  React.useEffect(() => {
    const updateTier = () => {
      const h = window.innerHeight;
      if (h < 700) {
        setTier('compact');
      } else if (h < 850) {
        setTier('standard');
      } else {
        setTier('spacious');
      }
    };
    
    updateTier();
    window.addEventListener('resize', updateTier);
    window.addEventListener('orientationchange', updateTier);
    
    return () => {
      window.removeEventListener('resize', updateTier);
      window.removeEventListener('orientationchange', updateTier);
    };
  }, []);

  return tier;
}