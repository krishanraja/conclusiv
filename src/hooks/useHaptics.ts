/**
 * useHaptics - Provides haptic feedback for mobile interactions
 * Uses the Vibration API when available
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10, 50, 30],
  warning: [30, 30, 30],
  error: [50, 100, 50],
  selection: 5,
};

export const useHaptics = () => {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = (type: HapticType = 'light') => {
    if (!isSupported) return;
    
    try {
      const pattern = HAPTIC_PATTERNS[type];
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail if vibration is not permitted
    }
  };

  const cancel = () => {
    if (!isSupported) return;
    
    try {
      navigator.vibrate(0);
    } catch (e) {
      // Silently fail
    }
  };

  return {
    isSupported,
    trigger,
    cancel,
    // Convenience methods
    light: () => trigger('light'),
    medium: () => trigger('medium'),
    heavy: () => trigger('heavy'),
    success: () => trigger('success'),
    warning: () => trigger('warning'),
    error: () => trigger('error'),
    selection: () => trigger('selection'),
  };
};
