import { useState, useCallback, useRef, useEffect } from "react";

export type CelebrationType = "confetti" | "mini" | "achievement";

interface CelebrationState {
  confetti: boolean;
  mini: boolean;
  achievement: { show: boolean; message: string; icon?: string };
}

export const useCelebration = () => {
  const [state, setState] = useState<CelebrationState>({
    confetti: false,
    mini: false,
    achievement: { show: false, message: "" },
  });

  // Track timeout IDs for cleanup on unmount
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current.clear();
    };
  }, []);

  const triggerConfetti = useCallback(() => {
    setState((prev) => ({ ...prev, confetti: true }));
    const timeoutId = setTimeout(() => {
      setState((prev) => ({ ...prev, confetti: false }));
      timeoutRefs.current.delete(timeoutId);
    }, 3500);
    timeoutRefs.current.add(timeoutId);
  }, []);

  const triggerMini = useCallback(() => {
    setState((prev) => ({ ...prev, mini: true }));
    const timeoutId = setTimeout(() => {
      setState((prev) => ({ ...prev, mini: false }));
      timeoutRefs.current.delete(timeoutId);
    }, 1500);
    timeoutRefs.current.add(timeoutId);
  }, []);

  const triggerAchievement = useCallback((message: string, icon?: string) => {
    setState((prev) => ({
      ...prev,
      achievement: { show: true, message, icon },
    }));
    const timeoutId = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        achievement: { show: false, message: "", icon: undefined },
      }));
      timeoutRefs.current.delete(timeoutId);
    }, 4000);
    timeoutRefs.current.add(timeoutId);
  }, []);

  const celebrate = useCallback((type: CelebrationType, options?: { message?: string; icon?: string }) => {
    switch (type) {
      case "confetti":
        triggerConfetti();
        break;
      case "mini":
        triggerMini();
        break;
      case "achievement":
        if (options?.message) {
          triggerAchievement(options.message, options.icon);
        }
        break;
    }
  }, [triggerConfetti, triggerMini, triggerAchievement]);

  return {
    ...state,
    celebrate,
    triggerConfetti,
    triggerMini,
    triggerAchievement,
  };
};
