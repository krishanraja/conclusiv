import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook that provides current window dimensions and updates on resize.
 * Returns safe defaults during SSR and updates reactively on window resize.
 *
 * Usage:
 * const { width, height } = useWindowSize();
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Handler to call on window resize with debouncing
    let timeoutId: NodeJS.Timeout;

    function handleResize() {
      // Clear existing timeout
      clearTimeout(timeoutId);

      // Debounce resize events (throttle to max 60fps)
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 16); // ~60fps
    }

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowSize;
}

/**
 * Hook that provides a clamped value between min and max based on viewport dimension.
 * Useful for responsive animations that need to scale with screen size.
 *
 * @param dimension - 'width' or 'height'
 * @param baseValue - The base pixel value for the animation
 * @param minScale - Minimum scale factor (default: 0.5 = 50% of base)
 * @param maxScale - Maximum scale factor (default: 1.5 = 150% of base)
 *
 * Usage:
 * const swipeDistance = useViewportScale('width', 400, 0.8, 1.0);
 */
export function useViewportScale(
  dimension: 'width' | 'height',
  baseValue: number,
  minScale = 0.5,
  maxScale = 1.5
): number {
  const { width, height } = useWindowSize();
  const viewport = dimension === 'width' ? width : height;

  // Calculate scale based on viewport size
  // For reference: 375px mobile, 768px tablet, 1920px desktop
  const referenceSize = dimension === 'width' ? 1920 : 1080;
  const scale = viewport / referenceSize;

  // Clamp scale between min and max
  const clampedScale = Math.max(minScale, Math.min(maxScale, scale));

  return baseValue * clampedScale;
}

/**
 * Hook that provides safe animation boundaries to prevent elements from racing off screen.
 * Returns maximum safe distances for x/y transforms as percentage of viewport.
 *
 * @param paddingPercent - Safety padding as percentage (default: 10% = 0.1)
 *
 * Usage:
 * const bounds = useAnimationBounds(0.05); // 5% padding
 * animate={{ x: Math.random() * bounds.maxX }}
 */
export function useAnimationBounds(paddingPercent = 0.1) {
  const { width, height } = useWindowSize();

  // Calculate safe boundaries (viewport dimension minus padding on both sides)
  const padding = {
    x: width * paddingPercent,
    y: height * paddingPercent,
  };

  return {
    minX: -width / 2 + padding.x,
    maxX: width / 2 - padding.x,
    minY: -height / 2 + padding.y,
    maxY: height / 2 - padding.y,
    width: width - padding.x * 2,
    height: height - padding.y * 2,
  };
}
